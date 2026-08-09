import { OrderTimeline } from '../order/orderTimeline.model.js';
import { CustomerTimeline } from '../customer/customerTimeline.model.js';
import { SupplierTimeline } from '../supplier/supplierTimeline.model.js';
import { activityLogService } from '../activityLog/activityLog.service.js';

function dateFilter(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return {};
  const range = {};
  if (dateFrom) range.$gte = new Date(dateFrom);
  if (dateTo) range.$lte = new Date(dateTo);
  return { createdAt: range };
}

// Every method here is a thin, named view over the ONE generic ActivityLog
// collection every module already writes to (Category through Accounting) -
// "User/Customer/Supplier Activity" and "Audit Logs" are all the same data,
// filtered differently, never a second logging pipeline.
export const activityReportsService = {
  getUserActivity(query) {
    return activityLogService.listActivity(query);
  },

  getCustomerActivity(query) {
    return activityLogService.listActivity({ ...query, module: 'customer' });
  },

  getSupplierActivity(query) {
    return activityLogService.listActivity({ ...query, module: 'supplier' });
  },

  getAuditLogs(query) {
    return activityLogService.listActivity(query);
  },

  // Merges the three customer-facing Timeline collections (Order/Customer/
  // Supplier) into one chronological feed - each already exists as its own
  // domain-specific ledger (Phase 7/8/9's deliberate "don't force-merge
  // into one generic table" precedent); this report is the read-only,
  // cross-domain VIEW over them that precedent always assumed a future
  // phase would add, without touching any of the three collections.
  async getTimelineReport({ dateFrom, dateTo, limit = 100 }) {
    const filter = dateFilter(dateFrom, dateTo);
    const [orderEvents, customerEvents, supplierEvents] = await Promise.all([
      OrderTimeline.find(filter).populate({ path: 'order', select: 'orderNumber' }).sort({ createdAt: -1 }).limit(limit),
      CustomerTimeline.find(filter).populate({ path: 'customer', select: 'displayName customerCode' }).sort({ createdAt: -1 }).limit(limit),
      SupplierTimeline.find(filter).populate({ path: 'supplier', select: 'name supplierCode' }).sort({ createdAt: -1 }).limit(limit),
    ]);

    const merged = [
      ...orderEvents.map((e) => ({ domain: 'order', event: e.event, note: e.note, entity: e.order?.orderNumber, createdAt: e.createdAt })),
      ...customerEvents.map((e) => ({ domain: 'customer', event: e.event, note: e.note, entity: e.customer?.displayName, createdAt: e.createdAt })),
      ...supplierEvents.map((e) => ({ domain: 'supplier', event: e.event, note: e.note, entity: e.supplier?.name, createdAt: e.createdAt })),
    ];

    return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  },
};
