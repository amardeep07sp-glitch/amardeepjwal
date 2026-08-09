import { PO_STATUS_TRANSITIONS, PURCHASE_RETURN_STATUS_TRANSITIONS } from './purchase.constants.js';

// Pure - no DB, independently unit-testable (same convention as
// order.statusTransition.js#canTransition / inventory.stockStatus.js). The
// single place purchaseOrder.service.js consults to enforce "status can
// never roll backward".
export const canTransition = (fromStatus, toStatus) => {
  const allowed = PO_STATUS_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
};

export const getAllowedNextStatuses = (fromStatus) => PO_STATUS_TRANSITIONS[fromStatus] ?? [];

export const canTransitionReturn = (fromStatus, toStatus) => {
  const allowed = PURCHASE_RETURN_STATUS_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
};
