import { counterService } from '../shared/counter.service.js';

// Thin, named wrapper over the shared atomic Counter (same one Phase 7's
// order.numbering.js uses) so supplierCode generation is a single sequence,
// never a client-guessed or collision-prone value.
export const supplierNumbering = {
  getNextSupplierCode: () => counterService.getNextSequence('supplierCode', { prefix: 'SUP', padLength: 6 }),
};
