export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  VIEWER: 'viewer',
  SUPPORT_AGENT: 'support_agent',
  SUPPORT_MANAGER: 'support_manager',
  CUSTOMER: 'customer',
});

// Every real backend role except CUSTOMER - matches backend's own
// STAFF_ROLES (constants/roles.js). Was missing VIEWER/SUPPORT_AGENT/
// SUPPORT_MANAGER until the Staff Management page needed to create
// accounts with those roles - without them here, a newly-created viewer/
// support account could log in (the backend allows it) but ProtectedRoute
// would immediately show ForbiddenPage, a dead end. Each page's own
// backend endpoints still enforce their own narrower role checks
// (authorize(...) per route) - this only gates the admin shell itself.
export const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.STAFF,
  ROLES.VIEWER,
  ROLES.SUPPORT_AGENT,
  ROLES.SUPPORT_MANAGER,
];

// Staff Management's own role picker - every ADMIN_ROLES entry (never
// CUSTOMER, which this admin-only feature never assigns).
export const STAFF_ROLES = ADMIN_ROLES;

export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.STAFF]: 'Staff',
  [ROLES.VIEWER]: 'Viewer',
  [ROLES.SUPPORT_AGENT]: 'Support Agent',
  [ROLES.SUPPORT_MANAGER]: 'Support Manager',
  [ROLES.CUSTOMER]: 'Customer',
});
