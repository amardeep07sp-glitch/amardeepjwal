import { jest } from '@jest/globals';

const mockOrderRepo = {
  findRawById: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};
const mockOrderItemRepo = {
  findByOrder: jest.fn(),
  findById: jest.fn(),
  insertMany: jest.fn(),
  updateStatus: jest.fn(),
  updateManyStatus: jest.fn(),
};
const mockOrderTimelineRepo = { findByOrder: jest.fn() };
const mockOrderActivityRepo = { findByOrder: jest.fn() };
const mockOrderAudit = { record: jest.fn() };
const mockOrderNumbering = { getNextOrderNumber: jest.fn() };
const mockOrderNotifications = { notify: jest.fn() };
const mockInventoryRepo = { findOneByScope: jest.fn() };
const mockInventoryService = {
  reserveStock: jest.fn(),
  releaseReservation: jest.fn(),
  convertReservationToSale: jest.fn(),
};
const mockInventoryLedgerService = { evaluateAlertsAfterCommit: jest.fn() };
const mockWarehouseRepo = { findDefault: jest.fn() };
const mockProductRepo = { findRawById: jest.fn() };
const mockVariantRepo = { findById: jest.fn(), findRawById: jest.fn() };
const mockMediaRepo = { findPaginatedByEntity: jest.fn() };
const mockBarcodeRepo = { findActiveForEntity: jest.fn(), findByValue: jest.fn() };
const mockOrderCsv = { buildOrdersCsv: jest.fn(), buildOrdersExcel: jest.fn() };
const mockAddressRepo = { findById: jest.fn() };
const mockCustomerRepo = { findRawById: jest.fn() };
const mockAccountingEvents = { recordSaleInvoice: jest.fn(), recordSaleCancellation: jest.fn(), recordCogs: jest.fn() };

const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/order/order.repository.js', () => ({ orderRepository: mockOrderRepo }));
jest.unstable_mockModule('../src/modules/order/orderItem.repository.js', () => ({ orderItemRepository: mockOrderItemRepo }));
jest.unstable_mockModule('../src/modules/order/orderTimeline.repository.js', () => ({ orderTimelineRepository: mockOrderTimelineRepo }));
jest.unstable_mockModule('../src/modules/order/orderActivity.repository.js', () => ({ orderActivityRepository: mockOrderActivityRepo }));
jest.unstable_mockModule('../src/modules/order/order.audit.js', () => ({ orderAudit: mockOrderAudit }));
jest.unstable_mockModule('../src/modules/order/order.numbering.js', () => ({ orderNumbering: mockOrderNumbering }));
jest.unstable_mockModule('../src/modules/order/order.notifications.js', () => ({ orderNotifications: mockOrderNotifications }));
jest.unstable_mockModule('../src/modules/order/order.csv.js', () => mockOrderCsv);
jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({ inventoryRepository: mockInventoryRepo }));
jest.unstable_mockModule('../src/modules/inventory/inventory.service.js', () => ({ inventoryService: mockInventoryService }));
jest.unstable_mockModule('../src/modules/inventory/inventoryLedger.service.js', () => ({ inventoryLedgerService: mockInventoryLedgerService }));
jest.unstable_mockModule('../src/modules/inventory/warehouse.repository.js', () => ({ warehouseRepository: mockWarehouseRepo }));
jest.unstable_mockModule('../src/modules/inventory/barcode.repository.js', () => ({ barcodeRepository: mockBarcodeRepo }));
jest.unstable_mockModule('../src/modules/product/product.repository.js', () => ({ productRepository: mockProductRepo }));
jest.unstable_mockModule('../src/modules/product/variant/variant.repository.js', () => ({ variantRepository: mockVariantRepo }));
jest.unstable_mockModule('../src/modules/address/address.repository.js', () => ({ addressRepository: mockAddressRepo }));
// Mocked for the same reason as pricing.schema.js above - customer.model.js
// calls `new mongoose.Schema(...)` at module-load time, and order.service.js
// imports customerRepository (Phase 8's customer-snapshot resolution).
jest.unstable_mockModule('../src/modules/customer/customer.repository.js', () => ({ customerRepository: mockCustomerRepo }));
// Mocked for the same reason as customer.repository.js above - transitively
// loads account.model.js, which calls `new mongoose.Schema(...)` at
// module-load time.
jest.unstable_mockModule('../src/modules/accounting/accountingEvents.service.js', () => ({ accountingEvents: mockAccountingEvents }));
jest.unstable_mockModule('../src/modules/media/media.repository.js', () => ({ mediaRepository: mockMediaRepo }));
// Mocked (not just its dependency) because priceCalculator.js pulls in
// pricing.schema.js for a constant, and pricing.schema.js calls `new
// mongoose.Schema(...)` at module-load time - with mongoose mocked below,
// that crashes the instant anything transitively imports it. None of the
// methods under test here (confirm/cancel/markDelivered) actually call
// calculatePricePreview - only createOrder's buildOrderItemPayload does.
jest.unstable_mockModule('../src/modules/product/pricing/priceCalculator.js', () => ({
  calculatePricePreview: jest.fn(),
  round2: (value) => Math.round((value + Number.EPSILON) * 100) / 100,
}));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { orderService } = await import('../src/modules/order/order.service.js');
const { ORDER_STATUSES, ORDER_ITEM_STATUSES, PAYMENT_STATUSES } = await import('../src/modules/order/order.constants.js');

beforeEach(() => {
  [
    mockOrderRepo,
    mockOrderItemRepo,
    mockOrderTimelineRepo,
    mockOrderActivityRepo,
    mockOrderAudit,
    mockOrderNumbering,
    mockOrderNotifications,
    mockInventoryRepo,
    mockInventoryService,
    mockInventoryLedgerService,
    mockWarehouseRepo,
    mockProductRepo,
    mockVariantRepo,
    mockMediaRepo,
    mockBarcodeRepo,
    mockOrderCsv,
    mockAddressRepo,
    mockCustomerRepo,
    mockAccountingEvents,
    mockSession,
  ].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));
});

describe('orderService.confirmOrder', () => {
  it('reserves inventory for every item and transitions to confirmed', async () => {
    const order = { _id: 'o1', orderStatus: ORDER_STATUSES.PENDING, warehouse: 'w1', orderNumber: 'ORD-0000001', save: jest.fn() };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderItemRepo.findByOrder.mockResolvedValue([
      { _id: 'i1', product: 'p1', variant: null, quantity: 2, sku: 'SKU1' },
      { _id: 'i2', product: 'p2', variant: null, quantity: 1, sku: 'SKU2' },
    ]);
    mockInventoryRepo.findOneByScope.mockResolvedValue({ _id: 'inv1' });
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderService.confirmOrder('o1', { userId: 'u1' });

    expect(mockInventoryService.reserveStock).toHaveBeenCalledTimes(2);
    expect(mockInventoryService.reserveStock).toHaveBeenCalledWith(
      'inv1',
      2,
      expect.objectContaining({ referenceType: 'order', referenceId: 'o1', performedBy: 'u1', session: mockSession })
    );
    expect(order.orderStatus).toBe(ORDER_STATUSES.CONFIRMED);
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.abortTransaction).not.toHaveBeenCalled();
  });

  it('snapshots the billing/shipping address once, at confirm-time', async () => {
    const order = {
      _id: 'o1',
      orderStatus: ORDER_STATUSES.PENDING,
      warehouse: 'w1',
      orderNumber: 'ORD-1',
      billingAddress: 'addr1',
      shippingAddress: 'addr1',
      billingAddressSnapshot: null,
      shippingAddressSnapshot: null,
      save: jest.fn(),
    };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderItemRepo.findByOrder.mockResolvedValue([]);
    mockAddressRepo.findById.mockResolvedValue({ line1: '123 Test St', city: 'Akbarpur', state: 'UP', postalCode: '224001', country: 'India' });
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderService.confirmOrder('o1', { userId: 'u1' });

    expect(order.billingAddressSnapshot).toEqual(expect.objectContaining({ line1: '123 Test St', city: 'Akbarpur' }));
    expect(order.shippingAddressSnapshot).toEqual(expect.objectContaining({ line1: '123 Test St' }));
  });

  it('does not re-fetch the address if a snapshot already exists (idempotent)', async () => {
    const existingSnapshot = { line1: 'already snapshotted', city: '', state: '', postalCode: '', country: '', label: '', phone: '' };
    const order = {
      _id: 'o1',
      orderStatus: ORDER_STATUSES.PENDING,
      warehouse: 'w1',
      orderNumber: 'ORD-1',
      billingAddress: 'addr1',
      billingAddressSnapshot: existingSnapshot,
      save: jest.fn(),
    };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderItemRepo.findByOrder.mockResolvedValue([]);
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderService.confirmOrder('o1', { userId: 'u1' });

    expect(mockAddressRepo.findById).not.toHaveBeenCalled();
    expect(order.billingAddressSnapshot).toBe(existingSnapshot);
  });

  it('rejects confirming an order that is not in a confirmable status', async () => {
    mockOrderRepo.findRawById.mockResolvedValue({ _id: 'o1', orderStatus: ORDER_STATUSES.CANCELLED, warehouse: 'w1' });

    await expect(orderService.confirmOrder('o1', { userId: 'u1' })).rejects.toThrow('Cannot confirm');
    expect(mockInventoryService.reserveStock).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });

  it('aborts the whole transaction if one item has no inventory record', async () => {
    const order = { _id: 'o1', orderStatus: ORDER_STATUSES.PENDING, warehouse: 'w1', orderNumber: 'ORD-1', save: jest.fn() };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderItemRepo.findByOrder.mockResolvedValue([{ _id: 'i1', product: 'p1', variant: null, quantity: 2, sku: 'SKU1' }]);
    mockInventoryRepo.findOneByScope.mockResolvedValue(null);

    await expect(orderService.confirmOrder('o1', { userId: 'u1' })).rejects.toThrow('No inventory record');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
  });
});

describe('orderService.cancelOrder', () => {
  it('releases reservations for a confirmed order and flags needsRefund when paid', async () => {
    const order = {
      _id: 'o1',
      orderStatus: ORDER_STATUSES.CONFIRMED,
      warehouse: 'w1',
      paymentStatus: PAYMENT_STATUSES.PAID,
      orderNumber: 'ORD-1',
      save: jest.fn(),
    };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderItemRepo.findByOrder.mockResolvedValue([
      { _id: 'i1', product: 'p1', variant: null, quantity: 2, status: ORDER_ITEM_STATUSES.PENDING },
    ]);
    mockInventoryRepo.findOneByScope.mockResolvedValue({ _id: 'inv1' });
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    const result = await orderService.cancelOrder('o1', { userId: 'u1', reason: 'customer request' });

    expect(mockInventoryService.releaseReservation).toHaveBeenCalledWith(
      'inv1',
      2,
      expect.objectContaining({ session: mockSession })
    );
    expect(result.needsRefund).toBe(true);
    expect(order.orderStatus).toBe(ORDER_STATUSES.CANCELLED);
  });

  it('does not touch inventory for a draft order (never reserved)', async () => {
    const order = {
      _id: 'o1',
      orderStatus: ORDER_STATUSES.DRAFT,
      warehouse: 'w1',
      paymentStatus: PAYMENT_STATUSES.PENDING,
      orderNumber: 'ORD-1',
      save: jest.fn(),
    };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderItemRepo.findByOrder.mockResolvedValue([]);
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderService.cancelOrder('o1', { userId: 'u1' });

    expect(mockInventoryService.releaseReservation).not.toHaveBeenCalled();
  });

  it('rejects cancelling an order that is already shipped', async () => {
    mockOrderRepo.findRawById.mockResolvedValue({ _id: 'o1', orderStatus: ORDER_STATUSES.SHIPPED, warehouse: 'w1' });

    await expect(orderService.cancelOrder('o1', { userId: 'u1' })).rejects.toThrow('Cannot cancel');
  });
});

describe('orderService.markDelivered', () => {
  it('converts each item reservation to a sale and marks the order delivered', async () => {
    const order = { _id: 'o1', orderStatus: ORDER_STATUSES.SHIPPED, warehouse: 'w1', orderNumber: 'ORD-1', save: jest.fn() };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderItemRepo.findByOrder
      .mockResolvedValueOnce([{ _id: 'i1', product: 'p1', variant: null, quantity: 2, status: ORDER_ITEM_STATUSES.SHIPPED }])
      .mockResolvedValueOnce([{ _id: 'i1', product: 'p1', variant: null, quantity: 2, status: ORDER_ITEM_STATUSES.DELIVERED }]);
    mockInventoryRepo.findOneByScope.mockResolvedValue({ _id: 'inv1' });
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderService.markDelivered('o1', { userId: 'u1' });

    expect(mockInventoryService.convertReservationToSale).toHaveBeenCalledWith(
      'inv1',
      2,
      expect.objectContaining({ session: mockSession })
    );
    expect(order.orderStatus).toBe(ORDER_STATUSES.DELIVERED);
  });

  it('marks the order partially_delivered when some items are not yet delivered', async () => {
    const order = { _id: 'o1', orderStatus: ORDER_STATUSES.PARTIALLY_SHIPPED, warehouse: 'w1', orderNumber: 'ORD-1', save: jest.fn() };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderItemRepo.findByOrder
      .mockResolvedValueOnce([{ _id: 'i1', product: 'p1', variant: null, quantity: 1, status: ORDER_ITEM_STATUSES.SHIPPED }])
      .mockResolvedValueOnce([
        { _id: 'i1', product: 'p1', variant: null, quantity: 1, status: ORDER_ITEM_STATUSES.DELIVERED },
        { _id: 'i2', product: 'p2', variant: null, quantity: 1, status: ORDER_ITEM_STATUSES.PENDING },
      ]);
    mockInventoryRepo.findOneByScope.mockResolvedValue({ _id: 'inv1' });
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderService.markDelivered('o1', { userId: 'u1', itemIds: ['i1'] });

    expect(order.orderStatus).toBe(ORDER_STATUSES.PARTIALLY_DELIVERED);
  });
});
