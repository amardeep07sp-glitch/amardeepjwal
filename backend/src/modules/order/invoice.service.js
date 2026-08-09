import { ApiError } from '../../utils/ApiError.js';
import { orderRepository } from './order.repository.js';
import { orderItemRepository } from './orderItem.repository.js';
import { invoiceRepository } from './invoice.repository.js';
import { orderNumbering } from './order.numbering.js';
import { buildInvoicePdf } from './invoice.pdf.js';
import { serializeOrder } from './order.serializer.js';
import { serializeOrderItemList } from './orderItem.serializer.js';
import { settingsRepository } from '../settings/settings.repository.js';
import { serializeSettings } from '../settings/settings.serializer.js';
import { round2 } from '../product/pricing/priceCalculator.js';

// Splits the order's own already-charged tax amount (never a second tax
// calculation) by real supply location - same state as the seller's
// registered address means CGST+SGST (split evenly), any other state means
// IGST (the full amount). A missing seller/buyer state can't be classified
// either way, so it's left `unknown` rather than guessed.
function computeTaxSplit(taxAmount, sellerState, buyerState) {
  if (!sellerState || !buyerState) return { taxType: 'unknown', cgstAmount: 0, sgstAmount: 0, igstAmount: 0 };

  const isIntraState = sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();
  if (isIntraState) {
    const half = round2(taxAmount / 2);
    return { taxType: 'intra_state', cgstAmount: half, sgstAmount: round2(taxAmount - half), igstAmount: 0 };
  }
  return { taxType: 'inter_state', cgstAmount: 0, sgstAmount: 0, igstAmount: round2(taxAmount) };
}

export const invoiceService = {
  // Idempotent - re-downloading an order's invoice never mints a second
  // invoiceNumber for the same order.
  async getOrCreateInvoice(orderId) {
    const existing = await invoiceRepository.findByOrder(orderId);
    if (existing) return existing;

    const order = await orderRepository.findRawById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    const settings = await settingsRepository.findSingleton();
    const buyerState = order.shippingAddressSnapshot?.state || order.billingAddressSnapshot?.state || '';
    const split = computeTaxSplit(order.tax, settings.registeredAddress?.state, buyerState);

    const invoiceNumber = await orderNumbering.getNextInvoiceNumber();
    return invoiceRepository.create({
      order: orderId,
      invoiceNumber,
      invoiceDate: new Date(),
      taxSummary: {
        taxableAmount: order.subtotal,
        taxAmount: order.tax,
        taxPercentage: order.subtotal > 0 ? round2((order.tax / order.subtotal) * 100) : 0,
        placeOfSupply: buyerState,
        ...split,
      },
    });
  },

  async generateInvoicePdf(orderId) {
    const invoice = await this.getOrCreateInvoice(orderId);
    const order = await orderRepository.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    const items = await orderItemRepository.findByOrder(orderId);
    const settings = await settingsRepository.findSingleton();

    return buildInvoicePdf({
      invoice,
      order: serializeOrder(order),
      items: serializeOrderItemList(items),
      seller: serializeSettings(settings),
    });
  },

  async listInvoices({ page, limit, search }) {
    const { items, total } = await invoiceRepository.findPaginated({ page, limit, search });
    return { items, meta: { page, limit, totalItems: total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },
};
