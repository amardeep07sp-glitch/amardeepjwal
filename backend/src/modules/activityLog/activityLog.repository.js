import { ActivityLog } from './activityLog.model.js';

export const activityLogRepository = {
  create(data) {
    return ActivityLog.create(data);
  },

  async findPaginated({ module, entityId, performedBy, dateFrom, dateTo, page, limit }) {
    const filter = {};
    if (module) filter.module = module;
    if (entityId) filter.entityId = entityId;
    if (performedBy) filter.performedBy = performedBy;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);

    return { items, total };
  },
};
