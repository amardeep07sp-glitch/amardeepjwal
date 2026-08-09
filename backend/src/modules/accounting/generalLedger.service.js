import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { accountRepository } from './account.repository.js';
import { JournalLine } from './journalLine.model.js';
import { NORMAL_BALANCE_SIDE } from './accounting.constants.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Signed delta a single {debit, credit} pair contributes to an account's
// balance, in "natural" terms for that account's type - the same rule
// journal.service.js#postJournal uses to maintain Account.currentBalance,
// reused here so a from-scratch ledger read and the live cached balance can
// never silently disagree about what a balance means.
// Exported for reuse by receivables.service.js/payables.service.js's aging
// engine - the exact same "which side increases the balance" rule applies
// there too.
export const signedDelta = (type, debit, credit) => (NORMAL_BALANCE_SIDE[type] === 'debit' ? debit - credit : credit - debit);

export const generalLedgerService = {
  // Full account ledger for a date range - opening balance (everything
  // before dateFrom), every line within range with a running balance
  // computed against that opening, and the resulting closing balance.
  // Deliberately unpaginated (see file-level reasoning in the module's
  // design notes) - a GL viewer reads a bounded date range, not an
  // unbounded feed.
  async getAccountLedger(accountId, { dateFrom, dateTo } = {}) {
    const account = await accountRepository.findRawById(accountId);
    if (!account) throw new ApiError(404, 'Account not found');

    const accountOid = new mongoose.Types.ObjectId(accountId);
    const rangeStart = dateFrom ? new Date(dateFrom) : null;
    const rangeEnd = dateTo ? new Date(dateTo) : null;

    const [openingAgg] = rangeStart
      ? await JournalLine.aggregate([
          { $match: { account: accountOid, date: { $lt: rangeStart } } },
          { $group: { _id: null, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
        ])
      : [];

    const openingBalance = round2(
      account.openingBalance + signedDelta(account.type, openingAgg?.debit ?? 0, openingAgg?.credit ?? 0)
    );

    const dateFilter = {};
    if (rangeStart) dateFilter.$gte = rangeStart;
    if (rangeEnd) dateFilter.$lte = rangeEnd;

    const lines = await JournalLine.find({ account: accountOid, ...(rangeStart || rangeEnd ? { date: dateFilter } : {}) })
      .sort({ date: 1, createdAt: 1 })
      .populate({ path: 'journal', select: 'journalNumber eventType narration status' });

    let runningBalance = openingBalance;
    const linesWithBalance = lines.map((line) => {
      runningBalance = round2(runningBalance + signedDelta(account.type, line.debit, line.credit));
      return {
        id: line._id,
        date: line.date,
        debit: line.debit,
        credit: line.credit,
        narration: line.narration,
        party: line.party,
        journal: line.journal
          ? { id: line.journal._id, journalNumber: line.journal.journalNumber, eventType: line.journal.eventType, narration: line.journal.narration, status: line.journal.status }
          : null,
        runningBalance,
      };
    });

    return {
      account: { id: account._id, code: account.code, name: account.name, type: account.type },
      openingBalance,
      lines: linesWithBalance,
      closingBalance: runningBalance,
    };
  },

  // Trial Balance - every active account's balance as of a date, split into
  // debit/credit columns per its natural side. Both columns must sum equal
  // by construction (postJournal never allows an unbalanced posting) - this
  // report IS that invariant made visible, the classic accounting sanity
  // check.
  async getTrialBalance(asOfDate) {
    const cutoff = asOfDate ? new Date(asOfDate) : new Date();
    const accounts = await accountRepository.findAll({ active: true });

    const agg = await JournalLine.aggregate([
      { $match: { date: { $lte: cutoff } } },
      { $group: { _id: '$account', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
    ]);
    const byAccount = new Map(agg.map((row) => [row._id.toString(), row]));

    let totalDebit = 0;
    let totalCredit = 0;
    const rows = accounts.map((account) => {
      const row = byAccount.get(account._id.toString());
      const balance = round2(account.openingBalance + signedDelta(account.type, row?.debit ?? 0, row?.credit ?? 0));
      const isDebitNormal = NORMAL_BALANCE_SIDE[account.type] === 'debit';
      const debitColumn = (isDebitNormal ? balance >= 0 : balance < 0) ? Math.abs(balance) : 0;
      const creditColumn = (isDebitNormal ? balance < 0 : balance >= 0) ? Math.abs(balance) : 0;
      totalDebit = round2(totalDebit + debitColumn);
      totalCredit = round2(totalCredit + creditColumn);
      return { id: account._id, code: account.code, name: account.name, type: account.type, debit: debitColumn, credit: creditColumn };
    });

    return { asOfDate: cutoff, rows, totalDebit, totalCredit, isBalanced: totalDebit === totalCredit };
  },
};
