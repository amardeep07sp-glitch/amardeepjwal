import { jest } from '@jest/globals';

const mockTaxService = { getTaxSummary: jest.fn() };

jest.unstable_mockModule('../src/modules/accounting/tax.service.js', () => ({ taxService: mockTaxService }));

const { taxReportsService } = await import('../src/modules/reports/taxReports.service.js');

const SUMMARY = [
  { accountId: 'a1', code: '1800', name: 'Input CGST Receivable', debit: 50, credit: 0, net: 50 },
  { accountId: 'a2', code: '1810', name: 'Input SGST Receivable', debit: 50, credit: 0, net: 50 },
  { accountId: 'a3', code: '2100', name: 'Output CGST Payable', debit: 0, credit: 80, net: -80 },
  { accountId: 'a4', code: '2110', name: 'Output SGST Payable', debit: 0, credit: 80, net: -80 },
];

beforeEach(() => {
  mockTaxService.getTaxSummary.mockReset();
  mockTaxService.getTaxSummary.mockResolvedValue(SUMMARY);
});

describe('taxReportsService filtering', () => {
  it('getCgstReport returns only the CGST input+output pair', async () => {
    const rows = await taxReportsService.getCgstReport({});
    expect(rows.map((r) => r.code)).toEqual(['1800', '2100']);
  });

  it('getInputTaxReport returns only Input* accounts', async () => {
    const rows = await taxReportsService.getInputTaxReport({});
    expect(rows.every((r) => r.code.startsWith('18'))).toBe(true);
  });

  it('getOutputTaxReport returns only Output* accounts', async () => {
    const rows = await taxReportsService.getOutputTaxReport({});
    expect(rows.every((r) => r.code.startsWith('21'))).toBe(true);
  });
});

describe('taxReportsService.getTaxLiability', () => {
  it('computes liability as negated sum of every row net (output collected minus input paid)', async () => {
    // Input net sum = 100, Output net sum = -160 -> total = -60 -> liability = 60
    const result = await taxReportsService.getTaxLiability({});
    expect(result.liability).toBe(60);
    expect(result.breakdown).toEqual(SUMMARY);
  });

  it('reports a negative liability (net input credit) when input tax exceeds output tax', async () => {
    mockTaxService.getTaxSummary.mockResolvedValue([
      { accountId: 'a1', code: '1800', name: 'Input CGST', debit: 100, credit: 0, net: 100 },
      { accountId: 'a3', code: '2100', name: 'Output CGST', debit: 0, credit: 10, net: -10 },
    ]);

    const result = await taxReportsService.getTaxLiability({});
    // total = 100 - 10 = 90 -> liability = -90 (we're owed, not owing)
    expect(result.liability).toBe(-90);
  });
});
