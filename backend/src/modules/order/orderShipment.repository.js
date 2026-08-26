import { OrderShipment } from './orderShipment.model.js';
import { SHIPMENT_STATUSES } from './order.constants.js';

const POPULATE_FIELDS = [{ path: 'order', select: 'orderNumber customer' }];

export const orderShipmentRepository = {
  async findPaginated({ page, limit, status }) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      OrderShipment.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
      OrderShipment.countDocuments(filter),
    ]);

    return { items, total };
  },

  findByOrder(orderId) {
    return OrderShipment.find({ order: orderId }).sort({ createdAt: -1 });
  },

  findById(id, session) {
    return OrderShipment.findById(id).session(session ?? null);
  },

  async create(data, session) {
    const [created] = await OrderShipment.create([data], { session: session ?? undefined });
    return created;
  },

  updateById(id, data, session) {
    return OrderShipment.findByIdAndUpdate(id, data, { new: true, session: session ?? undefined });
  },

  // Phase 59 automation sweep candidates - past their own estimate,
  // not yet delivered/failed, not already notified once.
  findDelayedUnnotified(now) {
    return OrderShipment.find({
      status: { $nin: [SHIPMENT_STATUSES.DELIVERED, SHIPMENT_STATUSES.FAILED] },
      estimatedDelivery: { $ne: null, $lt: now },
      delayNotifiedAt: null,
    }).populate(POPULATE_FIELDS);
  },

  markDelayNotified(id) {
    return OrderShipment.findByIdAndUpdate(id, { delayNotifiedAt: new Date() });
  },
};
