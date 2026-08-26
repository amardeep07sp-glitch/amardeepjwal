import { slaPolicyRepository } from './slaPolicy.repository.js';
import { SupportTicket } from './supportTicket.model.js';
import { activityLogService } from '../activityLog/activityLog.service.js';
import { TICKET_STATUSES } from './support.constants.js';

const addMinutes = (date, mins) => new Date(date.getTime() + mins * 60000);

export const slaService = {
  async getPolicy() {
    return slaPolicyRepository.getOrCreate();
  },

  async updatePolicy(tiers, userId) {
    return slaPolicyRepository.update(tiers, userId);
  },

  async getPolicyMap() {
    const policy = await slaPolicyRepository.getOrCreate();
    return new Map(policy.tiers.map((t) => [t.priority, t]));
  },

  // Deadlines are always computed from `fromDate` (the ticket's real
  // createdAt), never "now" - so re-running this after a priority change
  // still measures the SLA clock from when the ticket actually arrived,
  // the same way a real support desk's SLA would.
  async computeDeadlines(priority, fromDate) {
    const policyMap = await this.getPolicyMap();
    const tier = policyMap.get(priority);
    if (!tier) return { firstResponseDueAt: null, resolutionDueAt: null };
    return {
      firstResponseDueAt: addMinutes(fromDate, tier.firstResponseMins),
      resolutionDueAt: addMinutes(fromDate, tier.resolutionMins),
    };
  },

  // Sweep job's real work (support.jobs.js just calls this on an interval).
  // Only ever tightens `slaBreached` false -> true, never clears it back -
  // a breach that already happened is a historical fact about how late the
  // team was, not something that un-happens if an agent finally responds;
  // resolving/closing the ticket simply stops it from being swept again.
  async sweepBreaches() {
    const now = new Date();
    const candidates = await SupportTicket.find({
      slaBreached: false,
      status: { $nin: [TICKET_STATUSES.RESOLVED, TICKET_STATUSES.CLOSED] },
      $or: [
        { resolutionDueAt: { $ne: null, $lt: now } },
        { firstResponseAt: null, firstResponseDueAt: { $ne: null, $lt: now } },
      ],
    }).select('_id ticketNumber');

    if (candidates.length === 0) return 0;

    const ids = candidates.map((t) => t._id);
    await SupportTicket.updateMany({ _id: { $in: ids } }, { slaBreached: true, slaBreachedAt: now });

    await Promise.all(
      candidates.map((t) =>
        activityLogService.record({ module: 'support', action: 'ticket.sla_breached', entityId: t._id, entityName: t.ticketNumber, performedBy: null })
      )
    );

    return candidates.length;
  },
};
