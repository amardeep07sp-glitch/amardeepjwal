import { jest } from '@jest/globals';

const mockCustomerRepo = {
  findById: jest.fn(),
  findRawById: jest.fn(),
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  findByReferralCode: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  updateManyStatus: jest.fn(),
  addTag: jest.fn(),
  removeTag: jest.fn(),
  addSegment: jest.fn(),
  removeSegment: jest.fn(),
  getDashboardTotals: jest.fn(),
  getGrowthTrend: jest.fn(),
  findAllForExport: jest.fn(),
};
const mockWalletService = { provisionForCustomer: jest.fn() };
const mockLoyaltyService = { provisionForCustomer: jest.fn() };
const mockWalletRepo = { sumAllBalances: jest.fn() };
const mockLoyaltyRepo = { sumAllCurrentPoints: jest.fn() };
const mockCustomerAudit = { record: jest.fn() };
const mockCustomerTimelineRepo = { findByCustomer: jest.fn() };
const mockCustomerActivityRepo = { findByCustomer: jest.fn() };
const mockCustomerNumbering = { getNextCustomerCode: jest.fn(), generateReferralCode: jest.fn() };
const mockCustomerReferralService = { createReferral: jest.fn() };
const mockOrderRepo = { getCustomerOrderSummary: jest.fn() };
const mockCsv = { buildCustomersCsv: jest.fn(), buildCustomersExcel: jest.fn(), parseCustomersCsv: jest.fn() };
const mockPdf = { buildCustomerStatementPdf: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/customer/customer.repository.js', () => ({ customerRepository: mockCustomerRepo }));
jest.unstable_mockModule('../src/modules/customer/wallet.service.js', () => ({ walletService: mockWalletService }));
jest.unstable_mockModule('../src/modules/customer/loyalty.service.js', () => ({ loyaltyService: mockLoyaltyService }));
// Mocked for the same reason as customer.repository.js in order.service.test.js
// - customerWallet.model.js/customerLoyalty.model.js call `new mongoose.Schema(...)`
// at module-load time, and customer.service.js's dashboard totals import
// these repositories directly (read-only aggregates).
jest.unstable_mockModule('../src/modules/customer/wallet.repository.js', () => ({ walletRepository: mockWalletRepo }));
jest.unstable_mockModule('../src/modules/customer/loyalty.repository.js', () => ({ loyaltyRepository: mockLoyaltyRepo }));
jest.unstable_mockModule('../src/modules/customer/customer.audit.js', () => ({ customerAudit: mockCustomerAudit }));
jest.unstable_mockModule('../src/modules/customer/customerTimeline.repository.js', () => ({ customerTimelineRepository: mockCustomerTimelineRepo }));
jest.unstable_mockModule('../src/modules/customer/customerActivity.repository.js', () => ({ customerActivityRepository: mockCustomerActivityRepo }));
jest.unstable_mockModule('../src/modules/customer/customer.numbering.js', () => ({ customerNumbering: mockCustomerNumbering }));
jest.unstable_mockModule('../src/modules/customer/customerReferral.service.js', () => ({ customerReferralService: mockCustomerReferralService }));
jest.unstable_mockModule('../src/modules/order/order.repository.js', () => ({ orderRepository: mockOrderRepo }));
jest.unstable_mockModule('../src/modules/customer/customer.csv.js', () => mockCsv);
jest.unstable_mockModule('../src/modules/customer/customer.pdf.js', () => mockPdf);
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { customerService } = await import('../src/modules/customer/customer.service.js');

beforeEach(() => {
  [
    mockCustomerRepo,
    mockWalletService,
    mockLoyaltyService,
    mockWalletRepo,
    mockLoyaltyRepo,
    mockCustomerAudit,
    mockCustomerTimelineRepo,
    mockCustomerActivityRepo,
    mockCustomerNumbering,
    mockCustomerReferralService,
    mockOrderRepo,
    mockCsv,
    mockPdf,
    mockSession,
  ].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));

  mockCustomerNumbering.getNextCustomerCode.mockResolvedValue('CUST-000001');
  mockCustomerNumbering.generateReferralCode.mockReturnValue('ABCD1234');
  mockCustomerRepo.findByReferralCode.mockResolvedValue(null);
});

describe('customerService.createCustomer', () => {
  it('rejects a duplicate email with 409', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue({ _id: 'existing' });

    await expect(
      customerService.createCustomer({ firstName: 'Jane', email: 'jane@test.com' }, 'u1')
    ).rejects.toThrow('email already exists');

    expect(mockCustomerRepo.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate phone with 409', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue(null);
    mockCustomerRepo.findByPhone.mockResolvedValue({ _id: 'existing' });

    await expect(
      customerService.createCustomer({ firstName: 'Jane', phone: '9998887770' }, 'u1')
    ).rejects.toThrow('phone number already exists');
  });

  it('auto-provisions a Wallet and Loyalty record and generates a referral code', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue(null);
    mockCustomerRepo.findByPhone.mockResolvedValue(null);
    const created = { _id: 'c1', displayName: 'Jane Doe' };
    mockCustomerRepo.create.mockResolvedValue(created);
    mockCustomerRepo.findById.mockResolvedValue(created);

    await customerService.createCustomer({ firstName: 'Jane', lastName: 'Doe', phone: '9998887770' }, 'u1');

    expect(mockCustomerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerCode: 'CUST-000001', referralCode: 'ABCD1234' }),
      mockSession
    );
    expect(mockWalletService.provisionForCustomer).toHaveBeenCalledWith('c1', mockSession);
    expect(mockLoyaltyService.provisionForCustomer).toHaveBeenCalledWith('c1', mockSession);
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('resolves referredByCode and creates a CustomerReferral after commit', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue(null);
    mockCustomerRepo.findByPhone.mockResolvedValue(null);
    // findByReferralCode serves two purposes here: resolving the entered
    // referredByCode AND checking collision for the new customer's own
    // freshly-generated code - only the former should resolve to a referrer.
    mockCustomerRepo.findByReferralCode.mockImplementation((code) =>
      Promise.resolve(code === 'XYZ999' ? { _id: 'referrer1' } : null)
    );
    const created = { _id: 'c2', displayName: 'Referred Customer' };
    mockCustomerRepo.create.mockResolvedValue(created);
    mockCustomerRepo.findById.mockResolvedValue(created);

    await customerService.createCustomer({ firstName: 'Referred', referredByCode: 'xyz999' }, 'u1');

    expect(mockCustomerRepo.findByReferralCode).toHaveBeenCalledWith('XYZ999');
    expect(mockCustomerRepo.create).toHaveBeenCalledWith(expect.objectContaining({ referredBy: 'referrer1' }), mockSession);
    expect(mockCustomerReferralService.createReferral).toHaveBeenCalledWith('referrer1', 'c2');
  });

  it('aborts the transaction and never creates a referral if something fails mid-way', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue(null);
    mockCustomerRepo.findByPhone.mockResolvedValue(null);
    mockCustomerRepo.create.mockResolvedValue({ _id: 'c3', displayName: 'X' });
    mockWalletService.provisionForCustomer.mockRejectedValue(new Error('DB write failed'));

    await expect(customerService.createCustomer({ firstName: 'X' }, 'u1')).rejects.toThrow('DB write failed');

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockCustomerReferralService.createReferral).not.toHaveBeenCalled();
  });
});
