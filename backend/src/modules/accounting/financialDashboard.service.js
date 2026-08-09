import { accountRepository } from './account.repository.js';
import { accountService } from './account.service.js';
import { reportsService } from './reports.service.js';
import { JournalLine } from './journalLine.model.js';
import { ACCOUNT_TYPES, SYSTEM_ACCOUNT_CODES } from './accounting.constants.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const financialDashboardService = {
  async getDashboardTotals() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthPnl, ar, ap, cash] = await Promise.all([
      reportsService.getProfitAndLoss({ dateFrom: startOfMonth }),
      accountRepository.findByCode(SYSTEM_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE),
      accountRepository.findByCode(SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE),
      accountService.getCashBalance(),
    ]);

    return {
      revenue: monthPnl.totalIncome,
      expenses: monthPnl.totalExpense,
      profit: monthPnl.netProfit,
      receivables: ar?.currentBalance ?? 0,
      payables: ap?.currentBalance ?? 0,
      cash,
    };
  },

  // Income vs Expense, one bar-pair per month, for the last N months -
  // both series share the same currency scale, so a single-axis grouped
  // bar chart is correct here (never a dual-axis).
  async getIncomeVsExpenseTrend(months = 6) {
    const sinceDate = new Date();
    sinceDate.setMonth(sinceDate.getMonth() - (months - 1));
    sinceDate.setDate(1);
    sinceDate.setHours(0, 0, 0, 0);

    const accounts = await Promise.all([
      accountRepository.findAll({ type: ACCOUNT_TYPES.INCOME, active: true }),
      accountRepository.findAll({ type: ACCOUNT_TYPES.EXPENSE, active: true }),
    ]);
    const incomeIds = accounts[0].map((a) => a._id);
    const expenseIds = accounts[1].map((a) => a._id);

    const [incomeAgg, expenseAgg] = await Promise.all([
      JournalLine.aggregate([
        { $match: { account: { $in: incomeIds }, date: { $gte: sinceDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
      ]),
      JournalLine.aggregate([
        { $match: { account: { $in: expenseIds }, date: { $gte: sinceDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
      ]),
    ]);

    const incomeByMonth = Object.fromEntries(incomeAgg.map((r) => [r._id, round2(r.credit - r.debit)]));
    const expenseByMonth = Object.fromEntries(expenseAgg.map((r) => [r._id, round2(r.debit - r.credit)]));

    const series = [];
    for (let i = 0; i < months; i += 1) {
      const d = new Date(sinceDate);
      d.setMonth(d.getMonth() + i);
      const key = d.toISOString().slice(0, 7);
      series.push({ month: key, income: incomeByMonth[key] ?? 0, expense: expenseByMonth[key] ?? 0 });
    }
    return series;
  },

  // Net profit (Income - Expense) per day for the last N days - the single-
  // series counterpart to getIncomeVsExpenseTrend's two-series monthly view,
  // added for Phase 11's Executive Dashboard "Profit Trend" chart. Reuses
  // the exact same account sets, just grouped daily instead of monthly.
  async getProfitTrend(days = 14) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - (days - 1));
    sinceDate.setHours(0, 0, 0, 0);

    const [incomeAccounts, expenseAccounts] = await Promise.all([
      accountRepository.findAll({ type: ACCOUNT_TYPES.INCOME, active: true }),
      accountRepository.findAll({ type: ACCOUNT_TYPES.EXPENSE, active: true }),
    ]);
    const incomeIds = incomeAccounts.map((a) => a._id);
    const expenseIds = expenseAccounts.map((a) => a._id);

    const [incomeAgg, expenseAgg] = await Promise.all([
      JournalLine.aggregate([
        { $match: { account: { $in: incomeIds }, date: { $gte: sinceDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
      ]),
      JournalLine.aggregate([
        { $match: { account: { $in: expenseIds }, date: { $gte: sinceDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
      ]),
    ]);

    const incomeByDate = Object.fromEntries(incomeAgg.map((r) => [r._id, round2(r.credit - r.debit)]));
    const expenseByDate = Object.fromEntries(expenseAgg.map((r) => [r._id, round2(r.debit - r.credit)]));

    const series = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(sinceDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, profit: round2((incomeByDate[key] ?? 0) - (expenseByDate[key] ?? 0)) });
    }
    return series;
  },

  // Net Cash + Bank movement per day for the last N days - positive = net
  // inflow, negative = net outflow, around a zero baseline.
  async getCashFlowTrend(days = 14) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - (days - 1));
    sinceDate.setHours(0, 0, 0, 0);

    const [cashAccount, bankAccount] = await Promise.all([
      accountRepository.findByCode(SYSTEM_ACCOUNT_CODES.CASH),
      accountRepository.findByCode(SYSTEM_ACCOUNT_CODES.BANK),
    ]);

    const agg = await JournalLine.aggregate([
      { $match: { account: { $in: [cashAccount._id, bankAccount._id] }, date: { $gte: sinceDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
    ]);
    const byDate = Object.fromEntries(agg.map((r) => [r._id, round2(r.debit - r.credit)]));

    const series = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(sinceDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, netFlow: byDate[key] ?? 0 });
    }
    return series;
  },
};
