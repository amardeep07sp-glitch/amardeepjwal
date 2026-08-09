import { counterService } from '../shared/counter.service.js';

// Thin, named wrappers over the shared atomic Counter so every call site
// reads clearly instead of repeating raw sequence names/prefixes.
export const orderNumbering = {
  getNextOrderNumber: () => counterService.getNextSequence('orderNumber', { prefix: 'ORD', padLength: 7 }),
  getNextInvoiceNumber: () => counterService.getNextSequence('invoiceNumber', { prefix: 'INV', padLength: 7 }),
  getNextShipmentNumber: () => counterService.getNextSequence('shipmentNumber', { prefix: 'SHIP', padLength: 7 }),
};
