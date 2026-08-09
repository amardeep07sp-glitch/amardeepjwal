import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { invoiceService } from './invoice.service.js';
import { serializeInvoiceList } from './invoice.serializer.js';

export const downloadInvoice = asyncHandler(async (req, res) => {
  const pdfBuffer = await invoiceService.generateInvoicePdf(req.params.orderId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.orderId}.pdf"`);
  res.send(pdfBuffer);
});

export const listInvoices = asyncHandler(async (req, res) => {
  const { items, meta } = await invoiceService.listInvoices(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeInvoiceList(items), meta }, 'Invoices fetched successfully'));
});
