import { orderTimelineRepository } from './orderTimeline.repository.js';
import { orderActivityRepository } from './orderActivity.repository.js';
import { activityLogService } from '../activityLog/activityLog.service.js';

// Single place order.service.js (and every order-adjacent service - Payment/
// Shipment/Return/Refund) calls to satisfy "every status change is
// auditable" (Phase 7 spec, Goal section). Writes the Order-scoped
// OrderTimeline (customer-facing milestone, only when `event` is given) and
// OrderActivity (internal who/old/new/reason/IP/UA) rows inside the SAME
// transaction as the change they describe, then fires the generic
// cross-module ActivityLog feed best-effort (never blocks or aborts the
// real operation if that write fails - same contract activityLogService
// already documents).
export const orderAudit = {
  async record(
    { orderId, event, note, action, oldValue, newValue, reason, ipAddress, userAgent, performedBy, entityName },
    session
  ) {
    if (event) {
      await orderTimelineRepository.create({ order: orderId, event, note: note || '', createdBy: performedBy }, session);
    }

    await orderActivityRepository.create(
      {
        order: orderId,
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
      module: 'order',
      action: action || event,
      entityId: orderId,
      entityName: entityName || '',
      performedBy,
      metadata: { oldValue, newValue, reason },
    });
  },
};
