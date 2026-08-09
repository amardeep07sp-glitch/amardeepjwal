import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { accountRepository } from './account.repository.js';
import { JournalLine } from './journalLine.model.js';
import { customerRepository } from '../customer/customer.repository.js';
import { computeAging } from './aging.util.js';
import { signedDelta } from './generalLedger.service.js';
import { SYSTEM_ACCOUNT_CODES, PARTY_TYPES } from './accounting.constants.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

async function getArAccount() {
  const account = await accountRepository.findByCode(SYSTEM_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
  if (!account) throw new ApiError(500, 'Accounts Receivable system account is missing');
  return account;
}

export const receivablesService = {
  // One row per customer with a non-zero Accounts Receivable balance -
  // "Outstanding" per the spec.
  async getOutstanding() {
    const ar = await getArAccount();
    const rows = await JournalLine.aggregate([
      { $match: { account: ar._id, 'party.type': PARTY_TYPES.CUSTOMER } },
      { $group: { _id: '$party.id', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
      { $addFields: { balance: { $subtract: ['$debit', '$credit'] } } },
      { $match: { balance: { $ne: 0 } } },
      { $sort: { balance: -1 } },
    ]);

    const customers = await customerRepository.findManyByIds(rows.map((r) => r._id));
    const customerMap = new Map(customers.map((c) => [c._id.toString(), c]));

    return rows.map((row) => {
      const customer = customerMap.get(row._id.toString());
      return {
        customerId: row._id,
        customerName: customer?.displayName ?? 'Unknown customer',
        customerCode: customer?.customerCode ?? '',
        balance: round2(row.balance),
        // A negative balance means the customer is in credit (overpaid) -
        // real, valid, and distinct from a zero/positive balance.
        isCredit: row.balance < 0,
      };
    });
  },

  // FIFO-matched aging per customer - see aging.util.js#computeAging for
  // the algorithm. asOfDate defaults to now.
  async getAgingReport(asOfDate) {
    const ar = await getArAccount();
    const cutoff = asOfDate ? new Date(asOfDate) : new Date();

    const customerIds = await JournalLine.distinct('party.id', { account: ar._id, 'party.type': PARTY_TYPES.CUSTOMER });
    const customers = await customerRepository.findManyByIds(customerIds);
    const customerMap = new Map(customers.map((c) => [c._id.toString(), c]));

    const results = [];
    for (const customerId of customerIds) {
      // eslint-disable-next-line no-await-in-loop
      const lines = await JournalLine.find({ account: ar._id, 'party.type': PARTY_TYPES.CUSTOMER, 'party.id': customerId, date: { $lte: cutoff } }).sort({ date: 1 });
      const signedLines = lines.map((l) => ({ date: l.date, amount: signedDelta(ar.type, l.debit, l.credit) }));
      const aging = computeAging(signedLines, cutoff);
      if (aging.total === 0) continue; // eslint-disable-line no-continue

      const customer = customerMap.get(customerId.toString());
      results.push({
        customerId,
        customerName: customer?.displayName ?? 'Unknown customer',
        customerCode: customer?.customerCode ?? '',
        ...aging,
      });
    }

    return results.sort((a, b) => b.total - a.total);
  },

  // A single customer's full AR ledger - the "Customer Receivables"
  // drill-down (statement of account).
  async getCustomerLedger(customerId) {
    const ar = await getArAccount();
    const customerOid = new mongoose.Types.ObjectId(customerId);
    const lines = await JournalLine.find({ account: ar._id, 'party.type': PARTY_TYPES.CUSTOMER, 'party.id': customerOid })
      .sort({ date: 1, createdAt: 1 })
      .populate({ path: 'journal', select: 'journalNumber eventType narration' });

    let runningBalance = 0;
    return lines.map((line) => {
      runningBalance = round2(runningBalance + signedDelta(ar.type, line.debit, line.credit));
      return {
        id: line._id,
        date: line.date,
        debit: line.debit,
        credit: line.credit,
        journal: line.journal ? { id: line.journal._id, journalNumber: line.journal.journalNumber, eventType: line.journal.eventType, narration: line.journal.narration } : null,
        runningBalance,
      };
    });
  },
};
