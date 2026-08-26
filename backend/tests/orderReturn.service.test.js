import { jest } from '@jest/globals';

const mockOrderRepo = { findRawById: jest.fn() };
const mockOrderItemRepo = { findById: jest.fn(), updateStatus: jest.fn() };
const mockOrderReturnRepo = { findById: jest.fn(), create: jest.fn(), updateById: jest.fn(), findByOrder: jest.fn() };
const mockOrderAudit = { record: jest.fn() };
const mockInventoryRepo = { findOneByScope: jest.fn() };
const mockInventoryService = { recordReturn: jest.fn() };
const mockInventoryLedgerService = { evaluateAlertsAfterCommit: jest.fn() };
const mockCouponService = { releaseRedemptionForOrder: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/order/order.repository.js', () => ({ orderRepository: mockOrderRepo }));
jest.unstable_mockModule('../src/modules/order/orderItem.repository.js', () => ({ orderItemRepository: mockOrderItemRepo }));
jest.unstable_mockModule('../src/modules/order/orderReturn.repository.js', () => ({ orderReturnRepository: mockOrderReturnRepo }));
jest.unstable_mockModule('../src/modules/order/order.audit.js', () => ({ orderAudit: mockOrderAudit }));
jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({ inventoryRepository: mockInventoryRepo }));
jest.unstable_mockModule('../src/modules/inventory/inventory.service.js', () => ({ inventoryService: mockInventoryService }));
jest.unstable_mockModule('../src/modules/inventory/inventoryLedger.service.js', () => ({ inventoryLedgerService: mockInventoryLedgerService }));
// Mocked because coupon.service.js transitively loads coupon.model.js,
// which calls `new mongoose.Schema(...)` at module-load time - with
// mongoose mocked below, that crashes the instant anything imports it.
jest.unstable_mockModule('../src/modules/coupon/coupon.service.js', () => ({ couponService: mockCouponService }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { orderReturnService } = await import('../src/modules/order/orderReturn.service.js');

beforeEach(() => {
  [
    mockOrderRepo,
    mockOrderItemRepo,
    mockOrderReturnRepo,
    mockOrderAudit,
    mockInventoryRepo,
    mockInventoryService,
    mockInventoryLedgerService,
    mockCouponService,
    mockSession,
  ].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));
});

describe('orderReturnService transition guards', () => {
  it('rejects approving a return that is not in requested status', async () => {
    mockOrderReturnRepo.findById.mockResolvedValue({ _id: 'r1', status: 'approved', order: 'o1' });

    await expect(orderReturnService.approveReturn('r1', 'u1')).rejects.toThrow('Cannot move a return');
    expect(mockOrderReturnRepo.updateById).not.toHaveBeenCalled();
  });

  it('allows approving a requested return', async () => {
    mockOrderReturnRepo.findById.mockResolvedValue({ _id: 'r1', status: 'requested', order: 'o1' });
    mockOrderReturnRepo.updateById.mockResolvedValue({ _id: 'r1', status: 'approved' });

    await orderReturnService.approveReturn('r1', 'u1');

    expect(mockOrderReturnRepo.updateById).toHaveBeenCalledWith('r1', { status: 'approved', approvedBy: 'u1' });
  });
});

describe('orderReturnService.restockReturn', () => {
  it('credits returnedQuantity via inventoryService.recordReturn for every line item and marks items returned', async () => {
    const orderReturn = {
      _id: 'r1',
      order: 'o1',
      status: 'accepted',
      items: [{ orderItem: 'i1', returnQuantity: 2 }],
      save: jest.fn(),
    };
    mockOrderReturnRepo.findById.mockResolvedValue(orderReturn);
    mockOrderRepo.findRawById.mockResolvedValue({ _id: 'o1', warehouse: 'w1', orderNumber: 'ORD-1' });
    mockOrderItemRepo.findById.mockResolvedValue({ _id: 'i1', product: 'p1', variant: null });
    mockInventoryRepo.findOneByScope.mockResolvedValue({ _id: 'inv1' });

    await orderReturnService.restockReturn('r1', 'u1');

    expect(mockInventoryService.recordReturn).toHaveBeenCalledWith(
      'inv1',
      2,
      expect.objectContaining({ referenceType: 'order_return', referenceId: 'r1', session: mockSession })
    );
    expect(mockOrderItemRepo.updateStatus).toHaveBeenCalledWith('i1', 'returned', mockSession);
    expect(orderReturn.status).toBe('restocked');
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('rejects restocking a return that has not been accepted yet', async () => {
    mockOrderReturnRepo.findById.mockResolvedValue({ _id: 'r1', status: 'requested', order: 'o1', items: [] });

    await expect(orderReturnService.restockReturn('r1', 'u1')).rejects.toThrow('Cannot restock');
    expect(mockInventoryService.recordReturn).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});
