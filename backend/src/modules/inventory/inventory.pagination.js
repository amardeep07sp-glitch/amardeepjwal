// Shared by every controller in this module (Warehouse, Inventory, Barcode,
// StockAdjustment, StockTransfer, StockAudit) instead of each one re-defining
// the same tiny function, as every other module in this codebase currently
// does inline.
export const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});
