import { taxService } from '../accounting/tax.service.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const byCodePrefix = (rows, prefixes) => rows.filter((r) => prefixes.some((p) => r.code.startsWith(p)));

// Every method here reads Accounting's already-correct Tax Summary (Phase
// 10's taxService.getTaxSummary) and reshapes/filters it - the ledger
// itself, and the CGST/SGST/IGST split, are never recomputed here. This is
// the Reports module's job throughout: read existing modules, never
// duplicate their logic.
export const taxReportsService = {
  async getGstSummary(params) {
    return taxService.getTaxSummary(params);
  },

  async getCgstReport(params) {
    const rows = await taxService.getTaxSummary(params);
    return byCodePrefix(rows, ['1800', '2100']);
  },

  async getSgstReport(params) {
    const rows = await taxService.getTaxSummary(params);
    return byCodePrefix(rows, ['1810', '2110']);
  },

  async getIgstReport(params) {
    const rows = await taxService.getTaxSummary(params);
    return byCodePrefix(rows, ['1820', '2120']);
  },

  async getInputTaxReport(params) {
    const rows = await taxService.getTaxSummary(params);
    return byCodePrefix(rows, ['1800', '1810', '1820']);
  },

  async getOutputTaxReport(params) {
    const rows = await taxService.getTaxSummary(params);
    return byCodePrefix(rows, ['2100', '2110', '2120']);
  },

  // Net amount actually payable to (or refundable from) the government -
  // Output tax collected minus Input tax already paid. Each row's `net` is
  // debit-credit; for a liability (Output) account that's the NEGATIVE of
  // its true payable balance, so summing every row and negating the total
  // gives exactly Output-collected minus Input-paid in one step. A negative
  // result means a net input credit (refundable/carried forward), not an
  // amount owed - surfaced as-is, not clamped to zero.
  async getTaxLiability(params) {
    const rows = await taxService.getTaxSummary(params);
    const totalNet = rows.reduce((sum, r) => sum + r.net, 0);
    return { liability: round2(-totalNet), breakdown: rows };
  },
};
