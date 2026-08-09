import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { loyaltyRepository } from './loyalty.repository.js';
import { resolveLoyaltyTier } from './loyalty.tier.js';
import { customerAudit } from './customer.audit.js';
import { LOYALTY_TXN_TYPES, CUSTOMER_TIMELINE_EVENTS } from './customer.constants.js';

const TIMELINE_EVENT_BY_TYPE = {
  [LOYALTY_TXN_TYPES.EARN]: CUSTOMER_TIMELINE_EVENTS.POINTS_EARNED,
  [LOYALTY_TXN_TYPES.REDEEM]: CUSTOMER_TIMELINE_EVENTS.POINTS_REDEEMED,
};

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Redeeming/expiring points reduces the spendable balance but never the
// lifetime-earned figure tier is based on - a customer who redeems points
// doesn't get demoted a tier for having spent their reward. Only Earn (and
// a positive manual Adjust) count toward lifetime/tier.
function resolveDeltas(type, points) {
  switch (type) {
    case LOYALTY_TXN_TYPES.EARN:
      return { pointsDelta: Math.abs(points), lifetimeDelta: Math.abs(points) };
    case LOYALTY_TXN_TYPES.REDEEM:
    case LOYALTY_TXN_TYPES.EXPIRE:
      return { pointsDelta: -Math.abs(points), lifetimeDelta: 0 };
    case LOYALTY_TXN_TYPES.ADJUST:
      return { pointsDelta: points, lifetimeDelta: points > 0 ? points : 0 };
    default:
      return null;
  }
}

export const loyaltyService = {
  provisionForCustomer(customerId, session) {
    return loyaltyRepository.create(customerId, session);
  },

  async getLoyalty(customerId) {
    const loyalty = await loyaltyRepository.findByCustomer(customerId);
    if (!loyalty) throw new ApiError(404, 'Loyalty record not found for this customer');
    return loyalty;
  },

  async getLedger(customerId, { page, limit }) {
    const { items, total } = await loyaltyRepository.findLedgerPaginated(customerId, { page, limit });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  // ===========================================================================
  // THE single choke-point for every loyalty points change - mirrors
  // wallet.service.js#recordTransaction and inventoryLedgerService
  // .recordMovement()'s shape exactly.
  // ===========================================================================
  async recordTransaction(params, externalSession) {
    const { customerId, type, points, reason = '', referenceType = '', referenceId = null, expiresAt = null, performedBy = null } = params;

    const deltas = resolveDeltas(type, points);
    if (!deltas) throw new ApiError(400, `Unknown loyalty transaction type: ${type}`);

    const session = externalSession ?? (await mongoose.startSession());
    const ownsSession = !externalSession;
    if (ownsSession) session.startTransaction();

    try {
      const loyalty = await loyaltyRepository.findByCustomer(customerId, session);
      if (!loyalty) throw new ApiError(404, 'Loyalty record not found for this customer');

      const balanceAfter = loyalty.currentPoints + deltas.pointsDelta;
      if (balanceAfter < 0) {
        throw new ApiError(400, `Insufficient points balance (available: ${loyalty.currentPoints}, requested: ${Math.abs(deltas.pointsDelta)})`);
      }

      const newLifetime = loyalty.lifetimePointsEarned + deltas.lifetimeDelta;
      const newTier = resolveLoyaltyTier(newLifetime);

      await loyaltyRepository.updateBalance(customerId, { pointsDelta: deltas.pointsDelta, lifetimeDelta: deltas.lifetimeDelta, newTier }, session);

      const entry = await loyaltyRepository.createLedgerEntry(
        {
          customer: customerId,
          type,
          points: deltas.pointsDelta,
          balanceAfter,
          reason,
          referenceType,
          referenceId,
          expiresAt,
          performedBy,
        },
        session
      );

      // "Every interaction must be tracked" (Phase 8 spec Goal) - Earn/Redeem
      // get a named customer-facing Timeline event; Expire/Adjust still get
      // an Activity row (no event = no Timeline row, per order.audit.js's
      // established convention for non-milestone changes).
      await customerAudit.record(
        {
          customerId,
          event: TIMELINE_EVENT_BY_TYPE[type],
          action: `customer.loyalty_${type}`,
          newValue: { type, points: deltas.pointsDelta, balanceAfter, tier: newTier },
          reason,
          performedBy,
        },
        session
      );

      if (ownsSession) await session.commitTransaction();
      return entry;
    } catch (err) {
      if (ownsSession) await session.abortTransaction();
      throw err;
    } finally {
      if (ownsSession) session.endSession();
    }
  },
};
