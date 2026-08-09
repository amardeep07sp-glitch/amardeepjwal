import { jest } from '@jest/globals';

const mockLoyaltyRepo = {
  findByCustomer: jest.fn(),
  create: jest.fn(),
  updateBalance: jest.fn(),
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

jest.unstable_mockModule('../src/modules/customer/loyalty.repository.js', () => ({ loyaltyRepository: mockLoyaltyRepo }));
jest.unstable_mockModule('../src/modules/customer/customer.audit.js', () => ({ customerAudit: mockCustomerAudit }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { loyaltyService } = await import('../src/modules/customer/loyalty.service.js');

beforeEach(() => {
  [mockLoyaltyRepo, mockCustomerAudit, mockSession].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));
});

describe('loyaltyService.recordTransaction', () => {
  it('earning points increases both current points and lifetime earned, recalculating tier', async () => {
    mockLoyaltyRepo.findByCustomer.mockResolvedValue({ customer: 'c1', currentPoints: 100, lifetimePointsEarned: 4900 });
    mockLoyaltyRepo.createLedgerEntry.mockResolvedValue({ _id: 'l1', balanceAfter: 200 });

    await loyaltyService.recordTransaction({ customerId: 'c1', type: 'earn', points: 100, reason: 'Purchase' });

    // lifetimePointsEarned crosses 5000 -> gold
    expect(mockLoyaltyRepo.updateBalance).toHaveBeenCalledWith(
      'c1',
      { pointsDelta: 100, lifetimeDelta: 100, newTier: 'gold' },
      mockSession
    );
  });

  it('redeeming points reduces current points but never touches lifetime earned or tier', async () => {
    mockLoyaltyRepo.findByCustomer.mockResolvedValue({ customer: 'c1', currentPoints: 500, lifetimePointsEarned: 5000 });
    mockLoyaltyRepo.createLedgerEntry.mockResolvedValue({ _id: 'l2', balanceAfter: 300 });

    await loyaltyService.recordTransaction({ customerId: 'c1', type: 'redeem', points: 200, reason: 'Reward redeemed' });

    expect(mockLoyaltyRepo.updateBalance).toHaveBeenCalledWith(
      'c1',
      { pointsDelta: -200, lifetimeDelta: 0, newTier: 'gold' },
      mockSession
    );
  });

  it('rejects redeeming more points than the current balance', async () => {
    mockLoyaltyRepo.findByCustomer.mockResolvedValue({ customer: 'c1', currentPoints: 50, lifetimePointsEarned: 50 });

    await expect(
      loyaltyService.recordTransaction({ customerId: 'c1', type: 'redeem', points: 100, reason: 'Too much' })
    ).rejects.toThrow('Insufficient points balance');

    expect(mockLoyaltyRepo.updateBalance).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });

  it('a negative manual adjustment does not reduce lifetime points (no tier demotion)', async () => {
    mockLoyaltyRepo.findByCustomer.mockResolvedValue({ customer: 'c1', currentPoints: 1000, lifetimePointsEarned: 12000 });
    mockLoyaltyRepo.createLedgerEntry.mockResolvedValue({ _id: 'l3', balanceAfter: 900 });

    await loyaltyService.recordTransaction({ customerId: 'c1', type: 'adjust', points: -100, reason: 'Correction' });

    expect(mockLoyaltyRepo.updateBalance).toHaveBeenCalledWith(
      'c1',
      { pointsDelta: -100, lifetimeDelta: 0, newTier: 'platinum' },
      mockSession
    );
  });
});
