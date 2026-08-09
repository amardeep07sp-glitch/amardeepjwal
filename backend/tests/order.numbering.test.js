import { jest } from '@jest/globals';

const mockCounterService = {
  getNextSequence: jest.fn(),
};

jest.unstable_mockModule('../src/modules/shared/counter.service.js', () => ({
  counterService: mockCounterService,
}));

const { orderNumbering } = await import('../src/modules/order/order.numbering.js');

beforeEach(() => {
  Object.values(mockCounterService).forEach((fn) => fn.mockReset());
});

describe('orderNumbering', () => {
  it('requests an ORD-prefixed sequence for order numbers', async () => {
    mockCounterService.getNextSequence.mockResolvedValue('ORD-0000001');
    const result = await orderNumbering.getNextOrderNumber();
    expect(result).toBe('ORD-0000001');
    expect(mockCounterService.getNextSequence).toHaveBeenCalledWith('orderNumber', { prefix: 'ORD', padLength: 7 });
  });

  it('requests an INV-prefixed sequence for invoice numbers', async () => {
    mockCounterService.getNextSequence.mockResolvedValue('INV-0000001');
    await orderNumbering.getNextInvoiceNumber();
    expect(mockCounterService.getNextSequence).toHaveBeenCalledWith('invoiceNumber', { prefix: 'INV', padLength: 7 });
  });

  it('requests a SHIP-prefixed sequence for shipment numbers', async () => {
    mockCounterService.getNextSequence.mockResolvedValue('SHIP-0000001');
    await orderNumbering.getNextShipmentNumber();
    expect(mockCounterService.getNextSequence).toHaveBeenCalledWith('shipmentNumber', { prefix: 'SHIP', padLength: 7 });
  });
});
