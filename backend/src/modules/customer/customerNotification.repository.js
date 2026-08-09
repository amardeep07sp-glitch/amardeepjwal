import { CustomerNotification } from './customerNotification.model.js';

export const customerNotificationRepository = {
  async findPaginated(customerId, { page, limit }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      CustomerNotification.find({ customer: customerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      CustomerNotification.countDocuments({ customer: customerId }),
    ]);
    return { items, total };
  },

  create(data) {
    return CustomerNotification.create(data);
  },
};
