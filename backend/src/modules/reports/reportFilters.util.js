// Pure - no DB. The Filter Engine's shared plumbing (date range / pagination
// / sort) so all ~9 report domains parse these identically instead of each
// reinventing it - satisfies "No duplicate code" for a section the spec
// explicitly calls out as shared across every report.

export function buildDateRangeMatch(field, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return null;
  const range = {};
  if (dateFrom) range.$gte = new Date(dateFrom);
  if (dateTo) range.$lte = new Date(dateTo);
  return { [field]: range };
}

export function buildPaginationMeta(page, limit, totalItems) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

export function paginateStages(page, limit) {
  const skip = (Math.max(page, 1) - 1) * limit;
  return [{ $skip: skip }, { $limit: limit }];
}

export function buildSortStage(sortBy, sortOrder, fallback = 'createdAt') {
  const field = sortBy || fallback;
  return { [field]: sortOrder === 'asc' ? 1 : -1 };
}
