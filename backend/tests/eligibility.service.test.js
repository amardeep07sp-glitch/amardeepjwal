import { jest } from '@jest/globals';

const mockOrderRepo = { countRealOrdersByCustomer: jest.fn() };
const mockLoyaltyService = { getLoyalty: jest.fn() };

jest.unstable_mockModule('../src/modules/order/order.repository.js', () => ({ orderRepository: mockOrderRepo }));
jest.unstable_mockModule('../src/modules/customer/loyalty.service.js', () => ({ loyaltyService: mockLoyaltyService }));

const { checkCustomerEligibility } = await import('../src/modules/coupon/eligibility.service.js');
const { COUPON_ELIGIBILITY_TYPES } = await import('../src/modules/coupon/coupon.constants.js');

beforeEach(() => {
  mockOrderRepo.countRealOrdersByCustomer.mockReset();
  mockLoyaltyService.getLoyalty.mockReset();
});

describe('eligibility.service#checkCustomerEligibility', () => {
  it('allows everyone for ALL_CUSTOMERS', async () => {
    const result = await checkCustomerEligibility({ type: COUPON_ELIGIBILITY_TYPES.ALL_CUSTOMERS }, 'c1');
    expect(result).toEqual({ eligible: true });
  });

  it('defaults to ALL_CUSTOMERS when eligibility is missing', async () => {
    const result = await checkCustomerEligibility(undefined, 'c1');
    expect(result.eligible).toBe(true);
  });

  it('NEW_CUSTOMERS: eligible only with zero real orders', async () => {
    mockOrderRepo.countRealOrdersByCustomer.mockResolvedValue(0);
    await expect(checkCustomerEligibility({ type: COUPON_ELIGIBILITY_TYPES.NEW_CUSTOMERS }, 'c1')).resolves.toEqual({ eligible: true });

    mockOrderRepo.countRealOrdersByCustomer.mockResolvedValue(3);
    const result = await checkCustomerEligibility({ type: COUPON_ELIGIBILITY_TYPES.NEW_CUSTOMERS }, 'c1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/new customers/i);
  });

  it('FIRST_ORDER behaves the same as NEW_CUSTOMERS', async () => {
    mockOrderRepo.countRealOrdersByCustomer.mockResolvedValue(0);
    await expect(checkCustomerEligibility({ type: COUPON_ELIGIBILITY_TYPES.FIRST_ORDER }, 'c1')).resolves.toEqual({ eligible: true });
  });

  it('EXISTING_CUSTOMERS: eligible only with at least one real order', async () => {
    mockOrderRepo.countRealOrdersByCustomer.mockResolvedValue(2);
    await expect(checkCustomerEligibility({ type: COUPON_ELIGIBILITY_TYPES.EXISTING_CUSTOMERS }, 'c1')).resolves.toEqual({ eligible: true });

    mockOrderRepo.countRealOrdersByCustomer.mockResolvedValue(0);
    const result = await checkCustomerEligibility({ type: COUPON_ELIGIBILITY_TYPES.EXISTING_CUSTOMERS }, 'c1');
    expect(result.eligible).toBe(false);
  });

  it('VIP_CUSTOMERS: eligible only for gold/platinum/diamond loyalty tiers', async () => {
    mockLoyaltyService.getLoyalty.mockResolvedValue({ currentTier: 'gold' });
    await expect(checkCustomerEligibility({ type: COUPON_ELIGIBILITY_TYPES.VIP_CUSTOMERS }, 'c1')).resolves.toEqual({ eligible: true });

    mockLoyaltyService.getLoyalty.mockResolvedValue({ currentTier: 'silver' });
    const result = await checkCustomerEligibility({ type: COUPON_ELIGIBILITY_TYPES.VIP_CUSTOMERS }, 'c1');
    expect(result.eligible).toBe(false);
  });

  it('VIP_CUSTOMERS: treats a missing/errored loyalty record as not eligible, never throws', async () => {
    mockLoyaltyService.getLoyalty.mockRejectedValue(new Error('not found'));
    const result = await checkCustomerEligibility({ type: COUPON_ELIGIBILITY_TYPES.VIP_CUSTOMERS }, 'c1');
    expect(result.eligible).toBe(false);
  });

  it('SELECTED_CUSTOMERS: eligible only if the customer id is in the explicit list', async () => {
    const eligibility = { type: COUPON_ELIGIBILITY_TYPES.SELECTED_CUSTOMERS, selectedCustomers: ['c1', 'c2'] };
    await expect(checkCustomerEligibility(eligibility, 'c1')).resolves.toEqual({ eligible: true });
    const result = await checkCustomerEligibility(eligibility, 'c3');
    expect(result.eligible).toBe(false);
  });

  it('falls back to ineligible for an unknown type', async () => {
    const result = await checkCustomerEligibility({ type: 'not_a_real_type' }, 'c1');
    expect(result.eligible).toBe(false);
  });
});
