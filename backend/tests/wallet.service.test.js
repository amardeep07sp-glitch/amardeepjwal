import { jest } from '@jest/globals';

const mockWalletRepo = {
  findByCustomer: jest.fn(),
  create: jest.fn(),
  applyBalanceDelta: jest.fn(),
  findLedgerPaginated: jest.fn(),
  createLedgerEntry: jest.fn(),
};
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

const mockCustomerAudit = { record: jest.fn() };
const mockAccountingEvents = { recordWalletCredit: jest.fn(), recordWalletDebit: jest.fn() };

jest.unstable_mockModule('../src/modules/customer/wallet.repository.js', () => ({ walletRepository: mockWalletRepo }));
// Mocked to avoid loading customerTimeline.model.js/customerActivity.model.js
// for real - they call `new mongoose.Schema(...)` at module-load time, and
// mongoose is mocked below.
jest.unstable_mockModule('../src/modules/customer/customer.audit.js', () => ({ customerAudit: mockCustomerAudit }));
// Mocked for the same reason - transitively loads account.model.js.
jest.unstable_mockModule('../src/modules/accounting/accountingEvents.service.js', () => ({ accountingEvents: mockAccountingEvents }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { walletService } = await import('../src/modules/customer/wallet.service.js');

beforeEach(() => {
  [mockWalletRepo, mockCustomerAudit, mockAccountingEvents, mockSession].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));
});

describe('walletService.recordTransaction', () => {
  it('credits the wallet and writes a ledger row reflecting the new balance', async () => {
    mockWalletRepo.findByCustomer.mockResolvedValue({ customer: 'c1', balance: 500 });
    mockWalletRepo.createLedgerEntry.mockResolvedValue({ _id: 'l1', balanceAfter: 700 });

    const entry = await walletService.recordTransaction({
      customerId: 'c1',
      type: 'credit',
      amount: 200,
      reason: 'Goodwill credit',
      performedBy: 'u1',
    });

    expect(mockWalletRepo.applyBalanceDelta).toHaveBeenCalledWith('c1', 200, mockSession);
    expect(mockWalletRepo.createLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'c1', type: 'credit', amount: 200, balanceAfter: 700 }),
      mockSession
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(entry.balanceAfter).toBe(700);
  });

  it('rejects a debit that would take the balance negative (never applies the delta)', async () => {
    mockWalletRepo.findByCustomer.mockResolvedValue({ customer: 'c1', balance: 100 });

    await expect(
      walletService.recordTransaction({ customerId: 'c1', type: 'debit', amount: 500, reason: 'Overspend attempt' })
    ).rejects.toThrow('Insufficient wallet balance');

    expect(mockWalletRepo.applyBalanceDelta).not.toHaveBeenCalled();
    expect(mockWalletRepo.createLedgerEntry).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });

  it('applies a negative adjustment directly (signed amount, not a magnitude)', async () => {
    mockWalletRepo.findByCustomer.mockResolvedValue({ customer: 'c1', balance: 300 });
    mockWalletRepo.createLedgerEntry.mockResolvedValue({ _id: 'l2', balanceAfter: 250 });

    await walletService.recordTransaction({ customerId: 'c1', type: 'adjustment', amount: -50, reason: 'Correction' });

    expect(mockWalletRepo.applyBalanceDelta).toHaveBeenCalledWith('c1', -50, mockSession);
  });

  it('reuses the caller-provided session instead of opening its own transaction', async () => {
    mockWalletRepo.findByCustomer.mockResolvedValue({ customer: 'c1', balance: 100 });
    mockWalletRepo.createLedgerEntry.mockResolvedValue({ _id: 'l3', balanceAfter: 150 });
    const externalSession = { fake: true };

    await walletService.recordTransaction({ customerId: 'c1', type: 'refund', amount: 50, reason: 'Order refund' }, externalSession);

    expect(mockWalletRepo.applyBalanceDelta).toHaveBeenCalledWith('c1', 50, externalSession);
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
  });

  it('rejects an unknown transaction type before touching the wallet', async () => {
    await expect(
      walletService.recordTransaction({ customerId: 'c1', type: 'bogus', amount: 10, reason: 'x' })
    ).rejects.toThrow('Unknown wallet transaction type');
    expect(mockWalletRepo.findByCustomer).not.toHaveBeenCalled();
  });
});
