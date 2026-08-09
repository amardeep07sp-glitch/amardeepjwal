import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { accountRepository } from './account.repository.js';
import { JournalLine } from './journalLine.model.js';
import { supplierRepository } from '../supplier/supplier.repository.js';
import { computeAging } from './aging.util.js';
import { signedDelta } from './generalLedger.service.js';
import { SYSTEM_ACCOUNT_CODES, PARTY_TYPES } from './accounting.constants.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

async function getApAccount() {
  const account = await accountRepository.findByCode(SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE);
  if (!account) throw new ApiError(500, 'Accounts Payable system account is missing');
  return account;
}

export const payablesService = {
  // One row per supplier with a non-zero Accounts Payable balance -
  // "Outstanding" per the spec. Mirrors receivablesService.getOutstanding
  // exactly, applied to the Supplier/AP side.
  async getOutstanding() {
    const ap = await getApAccount();
    const rows = await JournalLine.aggregate([
      { $match: { account: ap._id, 'party.type': PARTY_TYPES.SUPPLIER } },
      { $group: { _id: '$party.id', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
      { $addFields: { balance: { $subtract: ['$credit', '$debit'] } } },
      { $match: { balance: { $ne: 0 } } },
      { $sort: { balance: -1 } },
    ]);

    const suppliers = await supplierRepository.findManyByIds(rows.map((r) => r._id));
    const supplierMap = new Map(suppliers.map((s) => [s._id.toString(), s]));

    return rows.map((row) => {
      const supplier = supplierMap.get(row._id.toString());
      return {
        supplierId: row._id,
        supplierName: supplier?.name ?? 'Unknown supplier',
        supplierCode: supplier?.supplierCode ?? '',
        balance: round2(row.balance),
        // A negative balance means we're in credit with this supplier
        // (overpaid, or a return exceeded what was owed).
        isCredit: row.balance < 0,
      };
    });
  },

  async getAgingReport(asOfDate) {
    const ap = await getApAccount();
    const cutoff = asOfDate ? new Date(asOfDate) : new Date();

    const supplierIds = await JournalLine.distinct('party.id', { account: ap._id, 'party.type': PARTY_TYPES.SUPPLIER });
    const suppliers = await supplierRepository.findManyByIds(supplierIds);
    const supplierMap = new Map(suppliers.map((s) => [s._id.toString(), s]));

    const results = [];
    for (const supplierId of supplierIds) {
      // eslint-disable-next-line no-await-in-loop
      const lines = await JournalLine.find({ account: ap._id, 'party.type': PARTY_TYPES.SUPPLIER, 'party.id': supplierId, date: { $lte: cutoff } }).sort({ date: 1 });
      const signedLines = lines.map((l) => ({ date: l.date, amount: signedDelta(ap.type, l.debit, l.credit) }));
      const aging = computeAging(signedLines, cutoff);
      if (aging.total === 0) continue; // eslint-disable-line no-continue

      const supplier = supplierMap.get(supplierId.toString());
      results.push({
        supplierId,
        supplierName: supplier?.name ?? 'Unknown supplier',
        supplierCode: supplier?.supplierCode ?? '',
        ...aging,
      });
    }

    return results.sort((a, b) => b.total - a.total);
  },

  async getSupplierLedger(supplierId) {
    const ap = await getApAccount();
    const supplierOid = new mongoose.Types.ObjectId(supplierId);
    const lines = await JournalLine.find({ account: ap._id, 'party.type': PARTY_TYPES.SUPPLIER, 'party.id': supplierOid })
      .sort({ date: 1, createdAt: 1 })
      .populate({ path: 'journal', select: 'journalNumber eventType narration' });

    let runningBalance = 0;
    return lines.map((line) => {
      runningBalance = round2(runningBalance + signedDelta(ap.type, line.debit, line.credit));
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
