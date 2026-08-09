import { customerTimelineRepository } from './customerTimeline.repository.js';
import { customerActivityRepository } from './customerActivity.repository.js';
import { activityLogService } from '../activityLog/activityLog.service.js';

// Single place customer.service.js (and every customer-adjacent service -
// Wallet/Loyalty/Referral/Note) calls to satisfy "every interaction must be
// tracked, every communication must be auditable" (Phase 8 spec, Goal
// section). Exact same shape as order.audit.js - writes the Customer-scoped
// CustomerTimeline (customer-facing milestone, only when `event` is given)
// and CustomerActivity (internal who/old/new/reason/IP/UA) rows inside the
// SAME transaction as the change they describe, then fires the generic
// cross-module ActivityLog feed best-effort.
export const customerAudit = {
  async record(
    { customerId, event, note, action, oldValue, newValue, reason, ipAddress, userAgent, performedBy, entityName },
    session
  ) {
    if (event) {
      await customerTimelineRepository.create({ customer: customerId, event, note: note || '', createdBy: performedBy }, session);
    }

    await customerActivityRepository.create(
      {
        customer: customerId,
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
      module: 'customer',
      action: action || event,
      entityId: customerId,
      entityName: entityName || '',
      performedBy,
      metadata: { oldValue, newValue, reason },
    });
  },
};
