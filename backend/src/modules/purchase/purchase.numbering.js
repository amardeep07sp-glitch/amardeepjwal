import { counterService } from '../shared/counter.service.js';

// Thin, named wrappers over the shared atomic Counter (Phase 7's
// order.numbering.js pattern) so every call site reads clearly instead of
// repeating raw sequence names/prefixes.
export const purchaseNumbering = {
  getNextPoNumber: () => counterService.getNextSequence('poNumber', { prefix: 'PO', padLength: 6 }),
  getNextGrnNumber: () => counterService.getNextSequence('grnNumber', { prefix: 'GRN', padLength: 6 }),
  getNextReturnNumber: () => counterService.getNextSequence('purchaseReturnNumber', { prefix: 'PRET', padLength: 6 }),
};
