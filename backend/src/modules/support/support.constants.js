export const TICKET_CATEGORIES = Object.freeze({
  ORDER: 'order',
  PAYMENT: 'payment',
  SHIPPING: 'shipping',
  RETURN: 'return',
  REFUND: 'refund',
  PRODUCT: 'product',
  COUPON: 'coupon',
  ACCOUNT: 'account',
  TECHNICAL: 'technical',
  OTHER: 'other',
});
export const TICKET_CATEGORY_VALUES = Object.values(TICKET_CATEGORIES);

export const TICKET_PRIORITIES = Object.freeze({ LOW: 'low', MEDIUM: 'medium', HIGH: 'high', URGENT: 'urgent' });
export const TICKET_PRIORITY_VALUES = Object.values(TICKET_PRIORITIES);

export const TICKET_STATUSES = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_FOR_CUSTOMER: 'waiting_for_customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
});
export const TICKET_STATUS_VALUES = Object.values(TICKET_STATUSES);

// Phase 23's lifecycle - forward-only except RESOLVED can bounce back to
// IN_PROGRESS (customer replies again after "resolved" - same relapse
// pattern OrderReturn/PurchaseReturn don't have but a conversation
// naturally does). CLOSED is terminal - a closed ticket needs a NEW ticket,
// never reopened (matches "customer confirms / timeout" being final).
export const TICKET_STATUS_TRANSITIONS = Object.freeze({
  [TICKET_STATUSES.OPEN]: [TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.IN_PROGRESS]: [TICKET_STATUSES.WAITING_FOR_CUSTOMER, TICKET_STATUSES.RESOLVED, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.WAITING_FOR_CUSTOMER]: [TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.RESOLVED]: [TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.CLOSED]: [],
});

export const TICKET_SOURCES = Object.freeze({ WEB: 'web', CONTEXTUAL: 'contextual' });
export const TICKET_SOURCE_VALUES = Object.values(TICKET_SOURCES);

export const MESSAGE_TYPES = Object.freeze({ MESSAGE: 'message', INTERNAL_NOTE: 'internal_note', SYSTEM_EVENT: 'system_event' });
export const MESSAGE_TYPE_VALUES = Object.values(MESSAGE_TYPES);

export const SENDER_ROLES = Object.freeze({ CUSTOMER: 'customer', AGENT: 'agent', SYSTEM: 'system' });
export const SENDER_ROLE_VALUES = Object.values(SENDER_ROLES);

// Phase 58's own example numbers, in minutes (the unit slaPolicy.model.js
// stores) - the seeded starting point for the singleton SlaPolicy document;
// admin-editable from there via sla.service.js#updatePolicy, never hardcoded
// again once that document exists.
// Phase 32 - a still-open ticket in the same category referencing the
// same order (its most common dedup key - a customer hitting "Get
// Support" from the same order twice) within this window is treated as
// the same conversation rather than a fresh ticket. Scoped to `context.
// orderId` specifically (not a generic entity match) since that's the
// one reference every category-driven ticket realistically shares.
export const TICKET_DUPLICATE_WINDOW_HOURS = 24;
export const TICKET_NON_TERMINAL_STATUSES = [
  TICKET_STATUSES.OPEN,
  TICKET_STATUSES.IN_PROGRESS,
  TICKET_STATUSES.WAITING_FOR_CUSTOMER,
];

export const SLA_POLICY_DEFAULTS = Object.freeze({
  [TICKET_PRIORITIES.URGENT]: { firstResponseMins: 2 * 60, resolutionMins: 2 * 60 },
  [TICKET_PRIORITIES.HIGH]: { firstResponseMins: 4 * 60, resolutionMins: 8 * 60 },
  [TICKET_PRIORITIES.MEDIUM]: { firstResponseMins: 8 * 60, resolutionMins: 24 * 60 },
  [TICKET_PRIORITIES.LOW]: { firstResponseMins: 24 * 60, resolutionMins: 48 * 60 },
});
