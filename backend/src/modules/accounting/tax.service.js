import { ApiError } from '../../utils/ApiError.js';
import { taxRateRepository } from './taxRate.repository.js';
import { accountRepository } from './account.repository.js';
import { JournalLine } from './journalLine.model.js';
import { SYSTEM_ACCOUNT_CODES } from './accounting.constants.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const TAX_ACCOUNT_CODES = [
  SYSTEM_ACCOUNT_CODES.OUTPUT_CGST,
  SYSTEM_ACCOUNT_CODES.OUTPUT_SGST,
  SYSTEM_ACCOUNT_CODES.OUTPUT_IGST,
  SYSTEM_ACCOUNT_CODES.INPUT_CGST,
  SYSTEM_ACCOUNT_CODES.INPUT_SGST,
  SYSTEM_ACCOUNT_CODES.INPUT_IGST,
];

export const taxService = {
  // Pure - no DB, independently unit-testable (same convention as
  // inventory.stockStatus.js#resolveStockStatus / purchase.statusTransition
  // .js#canTransition). Splits an already-computed tax amount (Order/
  // PurchaseOrder's own pricing already decided the RATE and total tax
  // figure) into its CGST/SGST/IGST components at posting time - GST-ready
  // per the spec, without pretending to know a customer/supplier's actual
  // state (that address-comparison logic is flagged as future work).
  splitTax(taxAmount, isInterState = false) {
    if (!taxAmount || taxAmount <= 0) return { cgst: 0, sgst: 0, igst: 0 };
    if (isInterState) return { cgst: 0, sgst: 0, igst: round2(taxAmount) };
    const half = round2(taxAmount / 2);
    return { cgst: half, sgst: round2(taxAmount - half), igst: 0 };
  },

  listRates() {
    return taxRateRepository.findAll();
  },

  async createRate(data) {
    if (data.isDefault) await taxRateRepository.unsetAllDefaults();
    return taxRateRepository.create(data);
  },

  async updateRate(id, data) {
    if (data.isDefault) await taxRateRepository.unsetAllDefaults();
    const rate = await taxRateRepository.updateById(id, data);
    if (!rate) throw new ApiError(404, 'Tax rate not found');
    return rate;
  },

  async deleteRate(id) {
    const deleted = await taxRateRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Tax rate not found');
  },

  // Tax Summary report - every CGST/SGST/IGST (input and output) account's
  // activity within a date range, so a GST return can be reconciled against
  // the books without hand-picking journals.
  async getTaxSummary({ dateFrom, dateTo } = {}) {
    const accounts = await accountRepository.findAll({ code: { $in: TAX_ACCOUNT_CODES } });
    const accountIds = accounts.map((a) => a._id);

    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    const agg = await JournalLine.aggregate([
      { $match: { account: { $in: accountIds }, ...(dateFrom || dateTo ? { date: dateFilter } : {}) } },
      { $group: { _id: '$account', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
    ]);
    const byAccount = new Map(agg.map((row) => [row._id.toString(), row]));

    return accounts.map((account) => {
      const row = byAccount.get(account._id.toString());
      return {
        accountId: account._id,
        code: account.code,
        name: account.name,
        debit: row?.debit ?? 0,
        credit: row?.credit ?? 0,
        net: round2((row?.debit ?? 0) - (row?.credit ?? 0)),
      };
    });
  },
};
