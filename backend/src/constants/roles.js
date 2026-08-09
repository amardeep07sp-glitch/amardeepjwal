export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  VIEWER: 'viewer',
  CUSTOMER: 'customer',
});

export const ROLE_VALUES = Object.values(ROLES);


export const PRIVILEGED_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER];
export const VIEW_ROLES = [...PRIVILEGED_ROLES, ROLES.STAFF, ROLES.VIEWER];
