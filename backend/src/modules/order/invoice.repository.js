import { Invoice } from './invoice.model.js';
import { Order } from './order.model.js';

const POPULATE_FIELDS = [
  { path: 'order', select: 'orderNumber grandTotal paymentStatus paymentMethod customerSnapshot createdAt', populate: { path: 'customer', select: 'displayName' } },
];

export const invoiceRepository = {
  findByOrder(orderId) {
    return Invoice.findOne({ order: orderId });
  },

  create(data) {
    return Invoice.create(data);
  },

  // Admin invoice list/search - same two-step "resolve matching Order ids
  // first" pattern order.repository.js's own search uses (Invoice has no
  // orderNumber of its own to regex against directly).
  async findPaginated({ page, limit, search }) {
    const filter = {};
    if (search) {
      const matchingOrderIds = await Order.find({ orderNumber: { $regex: search, $options: 'i' } }).distinct('_id');
      filter.$or = [{ invoiceNumber: { $regex: search, $options: 'i' } }, { order: { $in: matchingOrderIds } }];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Invoice.find(filter).populate(POPULATE_FIELDS).sort({ invoiceDate: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(filter),
    ]);
    return { items, total };
  },
};
