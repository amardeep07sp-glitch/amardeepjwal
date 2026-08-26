import { jest } from '@jest/globals';

const mockCouponRepo = {
  findByCode: jest.fn(),
  findById: jest.fn(),
  incrementUsage: jest.fn(),
  decrementUsage: jest.fn(),
};
const mockRedemptionRepo = {
  countByCustomerAndCoupon: jest.fn(),
  countByCouponSince: jest.fn(),
  create: jest.fn(),
  findByOrder: jest.fn(),
  markCancelled: jest.fn(),
  markRefunded: jest.fn(),
};
const mockCampaignRepo = {
  findById: jest.fn(),
  incrementSpentBudget: jest.fn(),
  decrementSpentBudget: jest.fn(),
};
const mockComputeCampaignStatus = jest.fn();
const mockProductRepo = { findRawByIds: jest.fn() };
const mockCategoryRepo = { findByIds: jest.fn() };
const mockCheckEligibility = jest.fn();

const makeSession = () => ({
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(() => Promise.resolve()),
  abortTransaction: jest.fn(() => Promise.resolve()),
  endSession: jest.fn(),
});

jest.unstable_mockModule('../src/modules/coupon/coupon.repository.js', () => ({ couponRepository: mockCouponRepo }));
jest.unstable_mockModule('../src/modules/coupon/couponRedemption.repository.js', () => ({ couponRedemptionRepository: mockRedemptionRepo }));
jest.unstable_mockModule('../src/modules/campaign/campaign.repository.js', () => ({ campaignRepository: mockCampaignRepo }));
jest.unstable_mockModule('../src/modules/campaign/campaign.service.js', () => ({ computeEffectiveStatus: mockComputeCampaignStatus }));
jest.unstable_mockModule('../src/modules/product/product.repository.js', () => ({ productRepository: mockProductRepo }));
jest.unstable_mockModule('../src/modules/category/category.repository.js', () => ({ categoryRepository: mockCategoryRepo }));
jest.unstable_mockModule('../src/modules/coupon/eligibility.service.js', () => ({ checkCustomerEligibility: mockCheckEligibility }));
// Mocked because couponRedemption.model.js calls `new mongoose.Schema(...)`
// at module-load time - REDEMPTION_STATUSES itself is just a plain frozen
// object, safe to re-export verbatim (not a Schema-dependent mock).
jest.unstable_mockModule('../src/modules/coupon/couponRedemption.model.js', () => ({
  REDEMPTION_STATUSES: Object.freeze({ REDEEMED: 'redeemed', CANCELLED: 'cancelled', REFUNDED: 'refunded' }),
}));
// promotionRules.service.js and discount.service.js are kept REAL (pure,
// separately unit-tested) so validateForCustomer is exercised against its
// actual scope-matching + discount-calculation logic, not a stub.
// priceCalculator.js is mocked only because it transitively pulls in
// pricing.schema.js, which calls `new mongoose.Schema(...)` at module-load
// time - same reasoning as order.service.test.js.
jest.unstable_mockModule('../src/modules/product/pricing/priceCalculator.js', () => ({
  calculatePricePreview: jest.fn(),
  round2: (value) => Math.round((value + Number.EPSILON) * 100) / 100,
}));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(makeSession())) },
}));

const { couponService, computeEffectiveStatus } = await import('../src/modules/coupon/coupon.service.js');
const { COUPON_STATUSES, COUPON_DISCOUNT_TYPES, DISCOUNT_BASES } = await import('../src/modules/coupon/coupon.constants.js');
const { ApiError } = await import('../src/utils/ApiError.js');

beforeEach(() => {
  [mockCouponRepo, mockRedemptionRepo, mockCampaignRepo, mockProductRepo, mockCategoryRepo, mockCheckEligibility, mockComputeCampaignStatus].forEach(
    (mockObj) => (typeof mockObj === 'function' ? mockObj.mockReset() : Object.values(mockObj).forEach((fn) => fn.mockReset()))
  );
  mockCheckEligibility.mockResolvedValue({ eligible: true });
  mockRedemptionRepo.countByCustomerAndCoupon.mockResolvedValue(0);
  mockRedemptionRepo.countByCouponSince.mockResolvedValue(0);
});

describe('coupon.service#computeEffectiveStatus', () => {
  it('returns manual states as-is (draft/paused/archived)', () => {
    expect(computeEffectiveStatus({ status: COUPON_STATUSES.DRAFT })).toBe(COUPON_STATUSES.DRAFT);
    expect(computeEffectiveStatus({ status: COUPON_STATUSES.PAUSED })).toBe(COUPON_STATUSES.PAUSED);
    expect(computeEffectiveStatus({ status: COUPON_STATUSES.ARCHIVED })).toBe(COUPON_STATUSES.ARCHIVED);
  });

  it('derives exhausted from real usageCount/usageLimit, never a stored flag', () => {
    const coupon = { status: COUPON_STATUSES.ACTIVE, usageLimit: 10, usageCount: 10, validFrom: new Date(Date.now() - 1000), validUntil: new Date(Date.now() + 1000) };
    expect(computeEffectiveStatus(coupon)).toBe(COUPON_STATUSES.EXHAUSTED);
  });

  it('derives scheduled/expired from real validFrom/validUntil', () => {
    const future = { status: COUPON_STATUSES.ACTIVE, usageLimit: null, validFrom: new Date(Date.now() + 100000), validUntil: new Date(Date.now() + 200000) };
    expect(computeEffectiveStatus(future)).toBe(COUPON_STATUSES.SCHEDULED);

    const past = { status: COUPON_STATUSES.ACTIVE, usageLimit: null, validFrom: new Date(Date.now() - 200000), validUntil: new Date(Date.now() - 100000) };
    expect(computeEffectiveStatus(past)).toBe(COUPON_STATUSES.EXPIRED);
  });

  it('is active when none of the above apply', () => {
    const coupon = { status: COUPON_STATUSES.ACTIVE, usageLimit: null, validFrom: new Date(Date.now() - 1000), validUntil: new Date(Date.now() + 100000) };
    expect(computeEffectiveStatus(coupon)).toBe(COUPON_STATUSES.ACTIVE);
  });
});

const activeCoupon = (overrides = {}) => ({
  _id: 'coupon1',
  code: 'DIWALI25',
  campaignId: null,
  status: COUPON_STATUSES.ACTIVE,
  discountType: COUPON_DISCOUNT_TYPES.PERCENTAGE,
  discountValue: 25,
  discountBase: DISCOUNT_BASES.CART_SUBTOTAL,
  maxDiscountAmount: 5000,
  minOrderValue: 20000,
  maximumCartValue: null,
  scope: { metals: ['gold'] },
  eligibility: { type: 'all_customers' },
  usageLimit: 10000,
  usageLimitPerCustomer: 1,
  usageCount: 0,
  dailyUsageLimit: null,
  validFrom: new Date(Date.now() - 100000),
  validUntil: new Date(Date.now() + 100000),
  ...overrides,
});

const goldCartItem = (overrides = {}) => ({ productId: 'p1', variantId: null, quantity: 1, unitPrice: 30000, total: 30000, ...overrides });

const stubScopeResolution = (products = []) => {
  mockProductRepo.findRawByIds.mockResolvedValue(products);
  mockCategoryRepo.findByIds.mockResolvedValue([]);
};

describe('coupon.service#validateForCustomer', () => {
  it('rejects an unknown code', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(null);
    await expect(couponService.validateForCustomer('NOPE', 'cust1', [goldCartItem()], { subtotal: 30000 })).rejects.toThrow('Invalid coupon code');
  });

  it('rejects a not-yet-active (scheduled) coupon with a specific message', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon({ validFrom: new Date(Date.now() + 100000) }));
    await expect(couponService.validateForCustomer('DIWALI25', 'cust1', [goldCartItem()], { subtotal: 30000 })).rejects.toThrow('not active yet');
  });

  it('rejects when the parent campaign is no longer active', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon({ campaignId: 'camp1' }));
    mockCampaignRepo.findById.mockResolvedValue({ _id: 'camp1' });
    mockComputeCampaignStatus.mockReturnValue('paused');
    await expect(couponService.validateForCustomer('DIWALI25', 'cust1', [goldCartItem()], { subtotal: 30000 })).rejects.toThrow('no longer running');
  });

  it('rejects when checkCustomerEligibility says no, surfacing its real reason', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon());
    mockCheckEligibility.mockResolvedValue({ eligible: false, reason: 'This offer is only for VIP members.' });
    await expect(couponService.validateForCustomer('DIWALI25', 'cust1', [goldCartItem()], { subtotal: 30000 })).rejects.toThrow('VIP members');
  });

  it('rejects when the customer already used it usageLimitPerCustomer times', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon({ usageLimitPerCustomer: 1 }));
    mockRedemptionRepo.countByCustomerAndCoupon.mockResolvedValue(1);
    await expect(couponService.validateForCustomer('DIWALI25', 'cust1', [goldCartItem()], { subtotal: 30000 })).rejects.toThrow('maximum number of times');
  });

  it('rejects when the daily usage limit is already hit', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon({ dailyUsageLimit: 5 }));
    mockRedemptionRepo.countByCouponSince.mockResolvedValue(5);
    await expect(couponService.validateForCustomer('DIWALI25', 'cust1', [goldCartItem()], { subtotal: 30000 })).rejects.toThrow('usage limit for today');
  });

  it('rejects a cart below minOrderValue', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon({ minOrderValue: 20000 }));
    await expect(couponService.validateForCustomer('DIWALI25', 'cust1', [goldCartItem({ total: 10000 })], { subtotal: 10000 })).rejects.toThrow('minimum order value');
  });

  it('rejects a cart above maximumCartValue', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon({ maximumCartValue: 50000 }));
    await expect(couponService.validateForCustomer('DIWALI25', 'cust1', [goldCartItem({ total: 60000 })], { subtotal: 60000 })).rejects.toThrow('only valid for orders up to');
  });

  it('rejects when no cart item matches the coupon scope', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon({ scope: { metals: ['platinum'] } }));
    stubScopeResolution([{ _id: 'p1', category: null, brand: null, collectionId: null, metal: 'gold', purity: '22K', gemstoneType: 'none', pricing: {} }]);
    await expect(couponService.validateForCustomer('DIWALI25', 'cust1', [goldCartItem()], { subtotal: 30000 })).rejects.toThrow('None of the items');
  });

  it('the Diwali acceptance scenario: 25% off gold, capped at 5000, on a 30000 eligible cart', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon());
    stubScopeResolution([{ _id: 'p1', category: null, brand: null, collectionId: null, metal: 'gold', purity: '22K', gemstoneType: 'none', pricing: { finalPrice: 30000, mrp: 30000 } }]);

    const result = await couponService.validateForCustomer('DIWALI25', 'cust1', [goldCartItem({ total: 30000 })], { subtotal: 30000 });

    expect(result.eligibleSubtotal).toBe(30000);
    expect(result.baseAmount).toBe(30000);
    expect(result.discountAmount).toBe(5000); // 25% of 30000 = 7500, capped at maxDiscountAmount 5000
  });

  it('excludes non-scoped items from the discount base even when the cart mixes eligible and ineligible items', async () => {
    mockCouponRepo.findByCode.mockResolvedValue(activeCoupon({ minOrderValue: 0 }));
    stubScopeResolution([
      { _id: 'p1', category: null, brand: null, collectionId: null, metal: 'gold', purity: '22K', gemstoneType: 'none', pricing: { finalPrice: 30000, mrp: 30000 } },
      { _id: 'p2', category: null, brand: null, collectionId: null, metal: 'silver', purity: '925', gemstoneType: 'none', pricing: { finalPrice: 5000, mrp: 5000 } },
    ]);

    const cartItems = [goldCartItem({ productId: 'p1', total: 30000 }), goldCartItem({ productId: 'p2', total: 5000 })];
    const result = await couponService.validateForCustomer('DIWALI25', 'cust1', cartItems, { subtotal: 35000 });

    expect(result.eligibleSubtotal).toBe(30000); // silver item excluded from the eligible base
    expect(result.eligibleItems).toHaveLength(1);
  });
});

describe('coupon.service#recordRedemption', () => {
  it('happy path: increments usage, writes the ledger row, and bumps campaign spend', async () => {
    mockCouponRepo.incrementUsage.mockResolvedValue({ _id: 'coupon1', campaignId: 'camp1', code: 'DIWALI25' });
    mockRedemptionRepo.create.mockResolvedValue({ _id: 'r1' });
    mockCampaignRepo.incrementSpentBudget.mockResolvedValue({ _id: 'camp1', spentBudget: 5000 });

    const redemption = await couponService.recordRedemption('coupon1', 'cust1', 'order1', 5000, DISCOUNT_BASES.CART_SUBTOTAL);

    expect(redemption).toEqual({ _id: 'r1' });
    expect(mockCampaignRepo.incrementSpentBudget).toHaveBeenCalledWith('camp1', 5000, expect.anything());
  });

  it('throws 409 and never writes a ledger row when the coupon just hit its limit', async () => {
    mockCouponRepo.incrementUsage.mockResolvedValue(null);

    await expect(couponService.recordRedemption('coupon1', 'cust1', 'order1', 5000, DISCOUNT_BASES.CART_SUBTOTAL)).rejects.toMatchObject({ statusCode: 409 });
    expect(mockRedemptionRepo.create).not.toHaveBeenCalled();
  });

  // Section 31/56's explicit requirement: 100 simultaneous redemption
  // attempts against a 100-use coupon must never produce more than 100
  // successful redemptions. couponRepository.incrementUsage is mocked here
  // to faithfully simulate MongoDB's real per-document atomicity - the
  // synchronous check-and-increment inside the mock body runs to
  // completion before yielding, exactly like a single findOneAndUpdate
  // call would on a real database - so this proves the SERVICE's logic
  // (refuse to redeem past a null result) is race-safe, on top of the
  // already-real atomic filter in coupon.repository.js#incrementUsage.
  it('never lets successful redemptions exceed usageLimit under 150 simultaneous attempts on a 100-use coupon', async () => {
    const dbCoupon = { _id: 'coupon1', campaignId: null, code: 'DIWALI25', usageCount: 0, usageLimit: 100 };

    mockCouponRepo.incrementUsage.mockImplementation(() => {
      if (dbCoupon.usageCount >= dbCoupon.usageLimit) return Promise.resolve(null);
      dbCoupon.usageCount += 1;
      return Promise.resolve({ ...dbCoupon });
    });
    mockRedemptionRepo.create.mockImplementation((data) => Promise.resolve({ _id: `r-${data.orderId}` }));

    const attempts = Array.from({ length: 150 }, (_, i) =>
      couponService.recordRedemption('coupon1', `cust${i}`, `order${i}`, 100, DISCOUNT_BASES.CART_SUBTOTAL)
    );
    const results = await Promise.allSettled(attempts);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(100);
    expect(rejected).toHaveLength(50);
    expect(dbCoupon.usageCount).toBe(100);
    rejected.forEach((r) => expect(r.reason).toBeInstanceOf(ApiError));
    rejected.forEach((r) => expect(r.reason.statusCode).toBe(409));
  });
});

describe('coupon.service#releaseRedemptionForOrder', () => {
  it('return_coupon policy: decrements usage/campaign spend and marks the ledger row cancelled', async () => {
    mockRedemptionRepo.findByOrder.mockResolvedValue([{ couponId: 'coupon1', campaignId: 'camp1', status: 'redeemed', discountAmount: 5000 }]);
    mockCouponRepo.findById.mockResolvedValue({ cancellationPolicy: 'return_coupon' });

    await couponService.releaseRedemptionForOrder('order1', { refund: false });

    expect(mockCouponRepo.decrementUsage).toHaveBeenCalledWith('coupon1');
    expect(mockCampaignRepo.decrementSpentBudget).toHaveBeenCalledWith('camp1', 5000);
    expect(mockRedemptionRepo.markCancelled).toHaveBeenCalledWith('order1');
    expect(mockRedemptionRepo.markRefunded).not.toHaveBeenCalled();
  });

  it('consume_coupon policy: leaves usage/campaign spend untouched but still closes the ledger row', async () => {
    mockRedemptionRepo.findByOrder.mockResolvedValue([{ couponId: 'coupon1', campaignId: 'camp1', status: 'redeemed', discountAmount: 5000 }]);
    mockCouponRepo.findById.mockResolvedValue({ cancellationPolicy: 'consume_coupon' });

    await couponService.releaseRedemptionForOrder('order1', { refund: true });

    expect(mockCouponRepo.decrementUsage).not.toHaveBeenCalled();
    expect(mockCampaignRepo.decrementSpentBudget).not.toHaveBeenCalled();
    expect(mockRedemptionRepo.markRefunded).toHaveBeenCalledWith('order1');
  });

  it('skips redemptions that are already cancelled or refunded (never double-releases)', async () => {
    mockRedemptionRepo.findByOrder.mockResolvedValue([{ couponId: 'coupon1', status: 'cancelled', discountAmount: 5000 }]);

    await couponService.releaseRedemptionForOrder('order1', {});

    expect(mockCouponRepo.decrementUsage).not.toHaveBeenCalled();
    expect(mockCouponRepo.findById).not.toHaveBeenCalled();
  });
});
