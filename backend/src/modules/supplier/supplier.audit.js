import { supplierTimelineRepository } from './supplierTimeline.repository.js';
import { supplierActivityRepository } from './supplierActivity.repository.js';
import { activityLogService } from '../activityLog/activityLog.service.js';

// Single place supplier.service.js AND every supplier-adjacent Purchase
// module service (PurchaseOrder/GRN/SupplierPayment/PurchaseReturn - see
// purchase.audit.js, a thin wrapper over this same file) calls to satisfy
// "every purchase/payment/return creates immutable...entries" and "Timeline
// / Activity" (Phase 9 spec, Supplier Management section). Exact same shape
// as order.audit.js/customer.audit.js - writes the Supplier-scoped
// SupplierTimeline (vendor-facing milestone, only when `event` is given)
// and SupplierActivity (internal who/old/new/reason/IP/UA) rows inside the
// SAME transaction as the change they describe, then fires the generic
// cross-module ActivityLog feed best-effort.
export const supplierAudit = {
  async record(
    { supplierId, event, note, action, oldValue, newValue, reason, ipAddress, userAgent, performedBy, entityName },
    session
  ) {
    if (event) {
      await supplierTimelineRepository.create({ supplier: supplierId, event, note: note || '', createdBy: performedBy }, session);
    }

    await supplierActivityRepository.create(
      {
        supplier: supplierId,
        action: action || event,
        oldValue: oldValue ?? null,
        newValue: newValue ?? null,
        reason: reason || '',
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        performedBy,
      },
      session
    );

    await activityLogService.record({
      module: 'supplier',
      action: action || event,
      entityId: supplierId,
      entityName: entityName || '',
      performedBy,
      metadata: { oldValue, newValue, reason },
    });
  },
};
