import { logger } from '../../config/logger.js';
import { activityLogRepository } from './activityLog.repository.js';
import { serializeActivityLogList } from './activityLog.serializer.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const activityLogService = {
  // Best-effort by design, same reasoning as category.service.js's Redis
  // cache calls: a logging failure (e.g. a bad connection) must never block
  // or fail the real write it's describing.
  async record({ module, action, entityId, entityName, performedBy, metadata }) {
    try {
      await activityLogRepository.create({ module, action, entityId, entityName, performedBy, metadata });
    } catch (err) {
      logger.warn({ err: err.message, module, action, entityId }, 'Activity log write failed');
    }
  },

  async listActivity(query) {
    const { page, limit, module, entityId, performedBy, dateFrom, dateTo } = query;
    const { items, total } = await activityLogRepository.findPaginated({ module, entityId, performedBy, dateFrom, dateTo, page, limit });
    return { items: serializeActivityLogList(items), meta: buildPaginationMeta(page, limit, total) };
  },
};
