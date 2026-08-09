import { jest } from '@jest/globals';

const mockReferralRepo = {
  findPaginated: jest.fn(),
  findByReferrer: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
};
const mockLoyaltyService = { recordTransaction: jest.fn() };

jest.unstable_mockModule('../src/modules/customer/customerReferral.repository.js', () => ({ customerReferralRepository: mockReferralRepo }));
jest.unstable_mockModule('../src/modules/customer/loyalty.service.js', () => ({ loyaltyService: mockLoyaltyService }));

const { customerReferralService } = await import('../src/modules/customer/customerReferral.service.js');

beforeEach(() => {
  [mockReferralRepo, mockLoyaltyService].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset()));
});

describe('customerReferralService.rewardReferral', () => {
  it('rejects rewarding a referral that has not been completed yet', async () => {
    mockReferralRepo.findById.mockResolvedValue({ _id: 'r1', status: 'pending', referrer: 'ref1' });

    await expect(customerReferralService.rewardReferral('r1', { rewardPoints: 100 }, 'u1')).rejects.toThrow(
      'Only a completed referral'
    );
    expect(mockLoyaltyService.recordTransaction).not.toHaveBeenCalled();
  });

  it('credits the referrer via loyaltyService.recordTransaction (never the ledger directly) and marks rewarded', async () => {
    const referral = { _id: 'r1', status: 'completed', referrer: 'ref1', save: jest.fn() };
    mockReferralRepo.findById.mockResolvedValue(referral);

    await customerReferralService.rewardReferral('r1', { rewardPoints: 150 }, 'u1');

    expect(mockLoyaltyService.recordTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'ref1',
        type: 'earn',
        points: 150,
        referenceType: 'customer_referral',
        referenceId: 'r1',
        performedBy: 'u1',
      })
    );
    expect(referral.status).toBe('rewarded');
    expect(referral.rewardPoints).toBe(150);
    expect(referral.save).toHaveBeenCalled();
  });
});

describe('customerReferralService.completeReferral', () => {
  it('marks a referral completed', async () => {
    mockReferralRepo.updateById.mockResolvedValue({ _id: 'r1', status: 'completed' });

    const result = await customerReferralService.completeReferral('r1');

    expect(mockReferralRepo.updateById).toHaveBeenCalledWith('r1', { status: 'completed' });
    expect(result.status).toBe('completed');
  });

  it('throws 404 when the referral does not exist', async () => {
    mockReferralRepo.updateById.mockResolvedValue(null);

    await expect(customerReferralService.completeReferral('missing')).rejects.toThrow('Referral not found');
  });
});
