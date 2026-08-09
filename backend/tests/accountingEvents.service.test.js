import { jest } from '@jest/globals';

const mockAccountRepo = { findByCode: jest.fn() };
const mockJournalRepo = { findByReference: jest.fn() };
const mockJournalService = { postJournal: jest.fn(), reverseJournal: jest.fn() };
const mockTaxService = { splitTax: jest.fn() };

const ACCOUNTS_BY_CODE = {
  '1000': { _id: 'acc-cash', code: '1000' },
  '1010': { _id: 'acc-bank', code: '1010' },
  '1100': { _id: 'acc-ar', code: '1100' },
  '1200': { _id: 'acc-inventory', code: '1200' },
  '1800': { _id: 'acc-input-cgst', code: '1800' },
  '1810': { _id: 'acc-input-sgst', code: '1810' },
  '1820': { _id: 'acc-input-igst', code: '1820' },
  '2000': { _id: 'acc-ap', code: '2000' },
  '4000': { _id: 'acc-revenue', code: '4000' },
  '4100': { _id: 'acc-shipping', code: '4100' },
  '5000': { _id: 'acc-sales-returns', code: '5000' },
};

jest.unstable_mockModule('../src/modules/accounting/account.repository.js', () => ({ accountRepository: mockAccountRepo }));
jest.unstable_mockModule('../src/modules/accounting/journal.repository.js', () => ({ journalRepository: mockJournalRepo }));
jest.unstable_mockModule('../src/modules/accounting/journal.service.js', () => ({ journalService: mockJournalService }));
jest.unstable_mockModule('../src/modules/accounting/tax.service.js', () => ({ taxService: mockTaxService }));

const { accountingEvents } = await import('../src/modules/accounting/accountingEvents.service.js');

beforeEach(() => {
  [mockAccountRepo, mockJournalRepo, mockJournalService, mockTaxService].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));
  mockAccountRepo.findByCode.mockImplementation((code) => Promise.resolve(ACCOUNTS_BY_CODE[code]));
  mockJournalService.postJournal.mockResolvedValue({ _id: 'j1' });
});

describe('accountingEvents.recordSaleInvoice', () => {
  it('builds a balanced entry: Dr AR(grandTotal) = Cr Revenue + Cr Shipping - Dr Discount', async () => {
    await accountingEvents.recordSaleInvoice({
      orderId: 'o1',
      customerId: 'c1',
      orderNumber: 'ORD-1',
      subtotal: 1000,
      couponDiscount: 50,
      shippingCharge: 100,
      handlingCharge: 0,
      grandTotal: 1050,
      performedBy: 'u1',
    });

    const [{ lines }] = mockJournalService.postJournal.mock.calls[0];
    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
    expect(totalDebit).toBe(totalCredit);
    expect(totalDebit).toBe(1100); // 1050 (AR) + 50 (discount)

    const arLine = lines.find((l) => l.account === 'acc-ar');
    expect(arLine).toEqual(expect.objectContaining({ debit: 1050, party: { type: 'customer', id: 'c1' } }));
  });

  it('omits the discount line entirely when there is no coupon discount', async () => {
    await accountingEvents.recordSaleInvoice({
      orderId: 'o1',
      customerId: 'c1',
      orderNumber: 'ORD-1',
      subtotal: 1000,
      couponDiscount: 0,
      shippingCharge: 0,
      handlingCharge: 0,
      grandTotal: 1000,
      performedBy: 'u1',
    });

    const [{ lines }] = mockJournalService.postJournal.mock.calls[0];
    expect(lines.find((l) => l.account === 'acc-sales-returns')).toBeUndefined();
  });
});

describe('accountingEvents.recordPurchaseReceipt', () => {
  it('splits tax intra-state into CGST+SGST and balances against Accounts Payable', async () => {
    mockTaxService.splitTax.mockReturnValue({ cgst: 15, sgst: 15, igst: 0 });

    await accountingEvents.recordPurchaseReceipt({
      purchaseOrderId: 'po1',
      supplierId: 's1',
      poNumber: 'PO-1',
      grnValue: 1000,
      taxAmount: 30,
      isInterState: false,
      performedBy: 'u1',
    });

    const [{ lines }] = mockJournalService.postJournal.mock.calls[0];
    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
    expect(totalDebit).toBe(totalCredit);
    expect(totalDebit).toBe(1030);

    expect(lines.find((l) => l.account === 'acc-input-cgst')).toEqual(expect.objectContaining({ debit: 15 }));
    expect(lines.find((l) => l.account === 'acc-input-sgst')).toEqual(expect.objectContaining({ debit: 15 }));
    expect(lines.find((l) => l.account === 'acc-input-igst')).toBeUndefined();
    const apLine = lines.find((l) => l.account === 'acc-ap');
    expect(apLine).toEqual(expect.objectContaining({ credit: 1030, party: { type: 'supplier', id: 's1' } }));
  });

  it('skips every tax line when there is no tax to book', async () => {
    await accountingEvents.recordPurchaseReceipt({
      purchaseOrderId: 'po1',
      supplierId: 's1',
      poNumber: 'PO-1',
      grnValue: 1000,
      taxAmount: 0,
      isInterState: false,
      performedBy: 'u1',
    });

    const [{ lines }] = mockJournalService.postJournal.mock.calls[0];
    expect(lines).toHaveLength(2);
    expect(mockTaxService.splitTax).not.toHaveBeenCalled();
  });
});

describe('accountingEvents.recordSaleCancellation', () => {
  it('reverses the original Sale Invoice journal when one exists', async () => {
    mockJournalRepo.findByReference.mockResolvedValue({ _id: 'j-original' });
    mockJournalService.reverseJournal.mockResolvedValue({ _id: 'j-reversal' });

    const result = await accountingEvents.recordSaleCancellation({ orderId: 'o1', reason: 'cancelled', performedBy: 'u1' });

    expect(mockJournalService.reverseJournal).toHaveBeenCalledWith('j-original', { reason: 'cancelled', performedBy: 'u1' }, undefined);
    expect(result).toEqual({ _id: 'j-reversal' });
  });

  it('is a no-op when the order was never invoiced', async () => {
    mockJournalRepo.findByReference.mockResolvedValue(null);

    const result = await accountingEvents.recordSaleCancellation({ orderId: 'o1', performedBy: 'u1' });

    expect(result).toBeNull();
    expect(mockJournalService.reverseJournal).not.toHaveBeenCalled();
  });
});
