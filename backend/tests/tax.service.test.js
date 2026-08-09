import { describe, it, expect } from '@jest/globals';
import { jest } from '@jest/globals';

const mockTaxRateRepo = { findAll: jest.fn(), findById: jest.fn(), findDefault: jest.fn(), create: jest.fn(), updateById: jest.fn(), deleteById: jest.fn(), unsetAllDefaults: jest.fn() };
const mockAccountRepo = { findAll: jest.fn() };

jest.unstable_mockModule('../src/modules/accounting/taxRate.repository.js', () => ({ taxRateRepository: mockTaxRateRepo }));
jest.unstable_mockModule('../src/modules/accounting/account.repository.js', () => ({ accountRepository: mockAccountRepo }));
// Mocked to avoid loading journalLine.model.js for real - not needed for
// splitTax (the only thing under test here), and it calls
// `new mongoose.Schema(...)` at module-load time.
jest.unstable_mockModule('../src/modules/accounting/journalLine.model.js', () => ({ JournalLine: { aggregate: jest.fn() } }));

const { taxService } = await import('../src/modules/accounting/tax.service.js');

describe('taxService.splitTax', () => {
  it('returns all zeros for a zero or missing tax amount', () => {
    expect(taxService.splitTax(0)).toEqual({ cgst: 0, sgst: 0, igst: 0 });
    expect(taxService.splitTax(null)).toEqual({ cgst: 0, sgst: 0, igst: 0 });
  });

  it('splits an intra-state tax evenly between CGST and SGST', () => {
    expect(taxService.splitTax(100, false)).toEqual({ cgst: 50, sgst: 50, igst: 0 });
  });

  it('assigns an odd amount entirely correctly (no paisa lost)', () => {
    const result = taxService.splitTax(99, false);
    expect(result.cgst + result.sgst).toBe(99);
    expect(result.igst).toBe(0);
  });

  it('assigns the full amount to IGST for an inter-state transaction', () => {
    expect(taxService.splitTax(100, true)).toEqual({ cgst: 0, sgst: 0, igst: 100 });
  });
});
