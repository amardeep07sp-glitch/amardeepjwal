import { ORDER_STATUS_TRANSITIONS } from './order.constants.js';

// Pure - no DB, independently unit-testable (same convention as
// inventory.stockStatus.js#resolveStockStatus). The single place
// order.service.js#transitionStatus consults to enforce "status can never
// roll backward" (Security section, Phase 7 spec).
export const canTransition = (fromStatus, toStatus) => {
  const allowed = ORDER_STATUS_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
};

export const getAllowedNextStatuses = (fromStatus) => ORDER_STATUS_TRANSITIONS[fromStatus] ?? [];
