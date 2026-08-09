import { supplierAudit } from '../supplier/supplier.audit.js';

// Every Purchase-module service (PurchaseOrder/GRN/SupplierPayment/
// PurchaseReturn) writes to the Supplier's own Timeline/Activity feed
// through this thin wrapper rather than importing supplier.audit.js
// directly - keeps the "who owns this collection" boundary clear (Supplier
// owns its Timeline/Activity; Purchase only ever appends to it) while
// reusing the exact same file, no duplicate audit-writing logic.
export const purchaseAudit = {
  record(params, session) {
    return supplierAudit.record(params, session);
  },
};
