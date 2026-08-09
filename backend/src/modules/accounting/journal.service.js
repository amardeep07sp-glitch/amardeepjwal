import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { accountRepository } from './account.repository.js';
import { journalRepository } from './journal.repository.js';
import { journalNumbering } from './journal.numbering.js';
import { activityLogService } from '../activityLog/activityLog.service.js';
import { NORMAL_BALANCE_SIDE, JOURNAL_STATUSES, ACCOUNTING_EVENT_TYPES, SYSTEM_ACCOUNT_CODES } from './accounting.constants.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Applies every line's signed delta to its Account.currentBalance - shared
// by postJournal and reverseJournal so the "which side increases the
// balance" decision (NORMAL_BALANCE_SIDE) is made in exactly one place.
async function applyLinesToAccounts(resolvedLines, session) {
  for (const { account, debit, credit } of resolvedLines) {
    const delta = NORMAL_BALANCE_SIDE[account.type] === 'debit' ? debit - credit : credit - debit;
    // eslint-disable-next-line no-await-in-loop
    await accountRepository.applyBalanceDelta(account._id, delta, session);
  }
}

export const journalService = {
  async listJournals(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await journalRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getJournalById(id) {
    const journal = await journalRepository.findById(id);
    if (!journal) throw new ApiError(404, 'Journal not found');
    const lines = await journalRepository.linesForJournal(id);
    return { journal, lines };
  },

  // ===========================================================================
  // THE single choke-point for every journal ever posted in this system - no
  // other file may call journalRepository.create/createLines or
  // accountRepository.applyBalanceDelta directly. Every Sales/Purchase/
  // Wallet/Expense accounting hook (accountingEvents.service.js) and every
  // manual journal (journal.controller.js) funnels through here. Mirrors
  // inventoryLedgerService.recordMovement()'s shape exactly: validate ->
  // apply deltas -> write immutable rows -> commit.
  //
  // `lines`: [{ account: ObjectId|string, debit, credit, party, narration }]
  // Exactly one of debit/credit must be positive per line; the set must sum
  // to equal, non-zero totals on both sides (true double entry) before
  // anything is written.
  // ===========================================================================
  async postJournal(params, externalSession) {
    const { date, eventType, referenceType = '', referenceId = null, narration = '', lines, performedBy = null } = params;

    if (!Object.values(ACCOUNTING_EVENT_TYPES).includes(eventType)) {
      throw new ApiError(400, `Unknown accounting event type: ${eventType}`);
    }
    if (!Array.isArray(lines) || lines.length < 2) {
      throw new ApiError(400, 'A journal requires at least two lines');
    }

    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      const debit = round2(line.debit || 0);
      const credit = round2(line.credit || 0);
      if (debit > 0 && credit > 0) throw new ApiError(400, 'A journal line cannot have both a debit and a credit');
      if (debit === 0 && credit === 0) throw new ApiError(400, 'A journal line must have either a debit or a credit');
      totalDebit = round2(totalDebit + debit);
      totalCredit = round2(totalCredit + credit);
    }
    if (totalDebit !== totalCredit) {
      throw new ApiError(400, `Unbalanced journal: total debit (${totalDebit}) does not equal total credit (${totalCredit})`);
    }
    if (totalDebit <= 0) throw new ApiError(400, 'A journal must have a positive total amount');

    const session = externalSession ?? (await mongoose.startSession());
    const ownsSession = !externalSession;
    if (ownsSession) session.startTransaction();

    try {
      const resolvedLines = [];
      for (const line of lines) {
        // eslint-disable-next-line no-await-in-loop
        const account = await accountRepository.findRawById(line.account, session);
        if (!account) throw new ApiError(404, `Account ${line.account} not found`);
        if (!account.active) throw new ApiError(400, `Account "${account.name}" is inactive and cannot receive new postings`);
        resolvedLines.push({ account, debit: round2(line.debit || 0), credit: round2(line.credit || 0), party: line.party ?? null, narration: line.narration ?? '' });
      }

      const journalNumber = await journalNumbering.getNextJournalNumber();
      const journalDate = date ?? new Date();

      const journal = await journalRepository.create(
        {
          journalNumber,
          date: journalDate,
          eventType,
          referenceType,
          referenceId,
          narration,
          status: JOURNAL_STATUSES.POSTED,
          totalAmount: totalDebit,
          postedBy: performedBy,
          postedAt: new Date(),
        },
        session
      );

      await journalRepository.createLines(
        resolvedLines.map((l) => ({
          journal: journal._id,
          account: l.account._id,
          debit: l.debit,
          credit: l.credit,
          party: l.party ?? { type: null, id: null },
          narration: l.narration,
          date: journalDate,
        })),
        session
      );

      await applyLinesToAccounts(resolvedLines, session);

      if (ownsSession) await session.commitTransaction();

      await activityLogService.record({
        module: 'accounting',
        action: `journal.posted.${eventType}`,
        entityId: journal._id,
        entityName: journalNumber,
        performedBy,
        metadata: { referenceType, referenceId, totalAmount: totalDebit },
      });

      return journal;
    } catch (err) {
      if (ownsSession) await session.abortTransaction();
      throw err;
    } finally {
      if (ownsSession) session.endSession();
    }
  },

  // Corrections NEVER edit a posted journal - they post a new journal with
  // every line's debit/credit swapped, then flag the original `reversed`
  // (a status marker only; its financial content is untouched forever).
  async reverseJournal(journalId, { reason, performedBy } = {}, externalSession) {
    const session = externalSession ?? (await mongoose.startSession());
    const ownsSession = !externalSession;
    if (ownsSession) session.startTransaction();

    try {
      const original = await journalRepository.findById(journalId, session);
      if (!original) throw new ApiError(404, 'Journal not found');
      if (original.status !== JOURNAL_STATUSES.POSTED) {
        throw new ApiError(400, `Only a posted journal can be reversed (this one is "${original.status}")`);
      }

      const originalLines = await journalRepository.linesForJournal(journalId, session);

      const journalNumber = await journalNumbering.getNextJournalNumber();
      const reversal = await journalRepository.create(
        {
          journalNumber,
          date: new Date(),
          eventType: original.eventType,
          referenceType: original.referenceType,
          referenceId: original.referenceId,
          narration: `Reversal of ${original.journalNumber}${reason ? ` - ${reason}` : ''}`,
          status: JOURNAL_STATUSES.POSTED,
          reversalOf: original._id,
          totalAmount: original.totalAmount,
          postedBy: performedBy,
          postedAt: new Date(),
        },
        session
      );

      const resolvedLines = originalLines.map((line) => ({
        account: line.account,
        debit: line.credit,
        credit: line.debit,
        party: line.party,
        narration: line.narration,
      }));

      await journalRepository.createLines(
        resolvedLines.map((l) => ({
          journal: reversal._id,
          account: l.account._id,
          debit: l.debit,
          credit: l.credit,
          party: l.party ?? { type: null, id: null },
          narration: l.narration,
          date: reversal.date,
        })),
        session
      );

      await applyLinesToAccounts(resolvedLines, session);

      await journalRepository.updateById(original._id, { status: JOURNAL_STATUSES.REVERSED }, session);

      if (ownsSession) await session.commitTransaction();

      await activityLogService.record({
        module: 'accounting',
        action: 'journal.reversed',
        entityId: reversal._id,
        entityName: journalNumber,
        performedBy,
        metadata: { reversalOf: original.journalNumber, reason },
      });

      return reversal;
    } catch (err) {
      if (ownsSession) await session.abortTransaction();
      throw err;
    } finally {
      if (ownsSession) session.endSession();
    }
  },

  // Posts a real, balanced entry against Opening Balance Equity so a
  // freshly-created account's starting balance is never just silently
  // assigned - see account.service.js#createAccount.
  async recordOpeningBalance(account, amount, userId) {
    const equityAccount = await accountRepository.findByCode(SYSTEM_ACCOUNT_CODES.OPENING_BALANCE_EQUITY);
    if (!equityAccount) throw new ApiError(500, 'Opening Balance Equity system account is missing');

    const isDebitNormal = NORMAL_BALANCE_SIDE[account.type] === 'debit';
    const magnitude = Math.abs(amount);
    const lines = isDebitNormal
      ? [
          { account: account._id, debit: magnitude, credit: 0 },
          { account: equityAccount._id, debit: 0, credit: magnitude },
        ]
      : [
          { account: account._id, debit: 0, credit: magnitude },
          { account: equityAccount._id, debit: magnitude, credit: 0 },
        ];

    return this.postJournal({
      eventType: ACCOUNTING_EVENT_TYPES.OPENING_BALANCE,
      referenceType: 'account',
      referenceId: account._id,
      narration: `Opening balance for ${account.code} - ${account.name}`,
      lines,
      performedBy: userId,
    });
  },

  // Admin-authored journal, no business-module event behind it - the one
  // path where a human, not an integration hook, decides the accounts.
  createManualJournal(data, userId) {
    return this.postJournal({
      date: data.date,
      eventType: ACCOUNTING_EVENT_TYPES.MANUAL,
      referenceType: 'manual',
      referenceId: null,
      narration: data.narration,
      lines: data.lines,
      performedBy: userId,
    });
  },
};
