export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  VIEWER: 'viewer',
  CUSTOMER: 'customer',
  // Support-desk-only roles - deliberately NOT added to PRIVILEGED_ROLES/
  // VIEW_ROLES below (those are shared across every other admin section -
  // inventory, accounting, purchasing, etc.). A support agent/manager gets
  // access to the support module specifically (see support.routes.js's own
  // canView/canManage), never the rest of the admin panel by virtue of
  // holding one of these two roles.
  SUPPORT_AGENT: 'support_agent',
  SUPPORT_MANAGER: 'support_manager',
});

export const ROLE_VALUES = Object.values(ROLES);


export const PRIVILEGED_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER];
export const VIEW_ROLES = [...PRIVILEGED_ROLES, ROLES.STAFF, ROLES.VIEWER];
