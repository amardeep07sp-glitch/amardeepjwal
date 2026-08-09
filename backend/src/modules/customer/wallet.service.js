import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { walletRepository } from './wallet.repository.js';
import { customerAudit } from './customer.audit.js';
import { accountingEvents } from '../accounting/accountingEvents.service.js';
import { WALLET_TXN_TYPES, CUSTOMER_TIMELINE_EVENTS } from './customer.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Credit/Debit/Refund take an unsigned magnitude (the type says which way it
// moves); Adjustment takes a signed amount directly, for a manual correction
// in either direction without forcing the caller to pick a fake type.
function resolveDelta(type, amount) {
  switch (type) {
    case WALLET_TXN_TYPES.CREDIT:
    case WALLET_TXN_TYPES.REFUND:
      return Math.abs(amount);
    case WALLET_TXN_TYPES.DEBIT:
      return -Math.abs(amount);
    case WALLET_TXN_TYPES.ADJUSTMENT:
      return amount;
    default:
      return null;
  }
}

export const walletService = {
  provisionForCustomer(customerId, session) {
    return walletRepository.create(customerId, session);
  },

  async getWallet(customerId) {
    const wallet = await walletRepository.findByCustomer(customerId);
    if (!wallet) throw new ApiError(404, 'Wallet not found for this customer');
    return wallet;
  },

  async getLedger(customerId, { page, limit }) {
    const { items, total } = await walletRepository.findLedgerPaginated(customerId, { page, limit });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  // ===========================================================================
  // THE single choke-point for every wallet balance change. No other file may
  // call walletRepository.applyBalanceDelta(). Mirrors
  // inventoryLedgerService.recordMovement()'s shape exactly: validate ->
  // apply delta -> write immutable ledger row -> commit.
  // ===========================================================================
  async recordTransaction(params, externalSession) {
    const { customerId, type, amount, reason = '', referenceType = '', referenceId = null, performedBy = null } = params;

    const delta = resolveDelta(type, amount);
    if (delta === null) throw new ApiError(400, `Unknown wallet transaction type: ${type}`);

    const session = externalSession ?? (await mongoose.startSession());
    const ownsSession = !externalSession;
    if (ownsSession) session.startTransaction();

    try {
      const wallet = await walletRepository.findByCustomer(customerId, session);
      if (!wallet) throw new ApiError(404, 'Wallet not found for this customer');

      const balanceAfter = wallet.balance + delta;
      if (balanceAfter < 0) {
        throw new ApiError(400, `Insufficient wallet balance (available: ${wallet.balance}, requested: ${Math.abs(delta)})`);
      }

      await walletRepository.applyBalanceDelta(customerId, delta, session);

      const entry = await walletRepository.createLedgerEntry(
        { customer: customerId, type, amount: delta, balanceAfter, reason, referenceType, referenceId, performedBy },
        session
      );

      // "Every interaction must be tracked" (Phase 8 spec Goal) - one
      // Timeline + Activity row per wallet transaction, same transaction.
      await customerAudit.record(
        {
          customerId,
          event: CUSTOMER_TIMELINE_EVENTS.WALLET_TRANSACTION,
          action: `customer.wallet_${type}`,
          newValue: { type, amount: delta, balanceAfter },
          reason,
          performedBy,
        },
        session
      );

      // CRM Wallet -> Financial Event (Phase 10 Integrations). A positive
      // delta is a credit (increases what we owe the customer); a negative
      // delta is a debit/redemption. accountingEvents alone decides the
      // Dr/Cr accounts - Wallet only reports the signed amount that
      // already happened, keeping it the same standalone engine Phase 8
      // locked it as.
      if (delta > 0) {
        await accountingEvents.recordWalletCredit({ customerId, amount: delta, reason, performedBy }, session);
      } else if (delta < 0) {
        await accountingEvents.recordWalletDebit({ customerId, amount: -delta, reason, performedBy }, session);
      }

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
