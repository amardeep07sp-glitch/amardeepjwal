import { accountRepository } from './account.repository.js';
import { journalRepository } from './journal.repository.js';
import { generalLedgerService } from './generalLedger.service.js';
import { JournalLine } from './journalLine.model.js';
import { ACCOUNT_TYPES, SYSTEM_ACCOUNT_CODES } from './accounting.constants.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

async function getAccountTypeBalances(types, cutoffDate) {
  const accounts = await accountRepository.findAll({ type: { $in: types }, active: true });
  const accountIds = accounts.map((a) => a._id);

  const agg = await JournalLine.aggregate([
    { $match: { account: { $in: accountIds }, ...(cutoffDate ? { date: { $lte: cutoffDate } } : {}) } },
    { $group: { _id: '$account', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
  ]);
  const byAccount = new Map(agg.map((row) => [row._id.toString(), row]));

  return accounts.map((account) => {
    const row = byAccount.get(account._id.toString());
    return { account, debit: row?.debit ?? 0, credit: row?.credit ?? 0 };
  });
}

export const reportsService = {
  // Income Statement - Income and Expense accounts only, for a date range.
  // Filtered by JournalLine.date directly (not cumulative-to-date like the
  // Balance Sheet) since P&L always reports activity WITHIN a period.
  async getProfitAndLoss({ dateFrom, dateTo } = {}) {
    const accounts = await accountRepository.findAll({ type: { $in: [ACCOUNT_TYPES.INCOME, ACCOUNT_TYPES.EXPENSE] }, active: true });
    const accountIds = accounts.map((a) => a._id);

    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    const agg = await JournalLine.aggregate([
      { $match: { account: { $in: accountIds }, ...(dateFrom || dateTo ? { date: dateFilter } : {}) } },
      { $group: { _id: '$account', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
    ]);
    const byAccount = new Map(agg.map((row) => [row._id.toString(), row]));

    const income = [];
    const expense = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (const account of accounts) {
      const row = byAccount.get(account._id.toString());
      if (!row) continue; // eslint-disable-line no-continue
      if (account.type === ACCOUNT_TYPES.INCOME) {
        const net = round2(row.credit - row.debit);
        if (net !== 0) {
          income.push({ id: account._id, code: account.code, name: account.name, amount: net });
          totalIncome = round2(totalIncome + net);
        }
      } else {
        const net = round2(row.debit - row.credit);
        if (net !== 0) {
          expense.push({ id: account._id, code: account.code, name: account.name, amount: net });
          totalExpense = round2(totalExpense + net);
        }
      }
    }

    return { dateFrom, dateTo, income, expense, totalIncome, totalExpense, netProfit: round2(totalIncome - totalExpense) };
  },

  // Point-in-time snapshot - Assets = Liabilities + Equity always holds
  // because Income/Expense activity up to the cutoff is folded in as a
  // single "Retained Earnings (Current Period)" equity line. This is what
  // makes the fundamental accounting equation balance even though P&L
  // accounts are never formally "closed" to Equity in this system.
  async getBalanceSheet(asOfDate) {
    const cutoff = asOfDate ? new Date(asOfDate) : new Date();

    const [assetRows, liabilityRows, equityRows, pAndL] = await Promise.all([
      getAccountTypeBalances([ACCOUNT_TYPES.ASSET], cutoff),
      getAccountTypeBalances([ACCOUNT_TYPES.LIABILITY], cutoff),
      getAccountTypeBalances([ACCOUNT_TYPES.EQUITY], cutoff),
      this.getProfitAndLoss({ dateTo: cutoff }),
    ]);

    const assets = assetRows
      .map((r) => ({ id: r.account._id, code: r.account.code, name: r.account.name, balance: round2(r.account.openingBalance + r.debit - r.credit) }))
      .filter((r) => r.balance !== 0);
    const liabilities = liabilityRows
      .map((r) => ({ id: r.account._id, code: r.account.code, name: r.account.name, balance: round2(r.account.openingBalance + r.credit - r.debit) }))
      .filter((r) => r.balance !== 0);
    const equity = equityRows
      .map((r) => ({ id: r.account._id, code: r.account.code, name: r.account.name, balance: round2(r.account.openingBalance + r.credit - r.debit) }))
      .filter((r) => r.balance !== 0);

    if (pAndL.netProfit !== 0) {
      equity.push({ id: null, code: '', name: 'Retained Earnings (Current Period)', balance: pAndL.netProfit });
    }

    const totalAssets = round2(assets.reduce((sum, a) => sum + a.balance, 0));
    const totalLiabilities = round2(liabilities.reduce((sum, l) => sum + l.balance, 0));
    const totalEquity = round2(equity.reduce((sum, e) => sum + e.balance, 0));

    return {
      asOfDate: cutoff,
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: totalAssets === round2(totalLiabilities + totalEquity),
    };
  },

  // Cash + Bank combined, chronologically, with a running balance across
  // both - the classic "Cash Book".
  async getCashBook({ dateFrom, dateTo } = {}) {
    const cashAccount = await accountRepository.findByCode(SYSTEM_ACCOUNT_CODES.CASH);
    const bankAccount = await accountRepository.findByCode(SYSTEM_ACCOUNT_CODES.BANK);

    const [cashLedger, bankLedger] = await Promise.all([
      generalLedgerService.getAccountLedger(cashAccount._id, { dateFrom, dateTo }),
      generalLedgerService.getAccountLedger(bankAccount._id, { dateFrom, dateTo }),
    ]);

    const combined = [
      ...cashLedger.lines.map((l) => ({ ...l, accountName: 'Cash' })),
      ...bankLedger.lines.map((l) => ({ ...l, accountName: 'Bank' })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = round2(cashLedger.openingBalance + bankLedger.openingBalance);
    const lines = combined.map((line) => {
      runningBalance = round2(runningBalance + line.debit - line.credit);
      return { ...line, runningBalance };
    });

    return {
      openingBalance: round2(cashLedger.openingBalance + bankLedger.openingBalance),
      lines,
      closingBalance: runningBalance,
    };
  },

  // Every journal posted on a given day, in full - the classic "Day Book".
  async getDayBook(date) {
    const day = date ? new Date(date) : new Date();
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    const { items: journals } = await journalRepository.findPaginated({ page: 1, limit: 500, dateFrom: start, dateTo: end });

    const entries = [];
    for (const journal of journals) {
      // eslint-disable-next-line no-await-in-loop
      const lines = await journalRepository.linesForJournal(journal._id);
      entries.push({ journal, lines });
    }

    return { date: start, entries };
  },
};
