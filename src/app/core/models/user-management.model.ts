/**
 * Wire models for the admin user-management endpoints of the MapnaCM backend
 * (Identity module). Field names are the camelCased C# properties coming from
 * the Response<T> envelope (AddNewtonsoftJson applies camelCase).
 */

/** Shared.Core ValueObjects.Filter — operation strings match the backend Operator enum ("Conatains" is spelled that way server-side). */
export interface QueryFilter {
  propertyName: string;
  operation: 'Eq' | 'NotEq' | 'Gt' | 'Lt' | 'GtOrEq' | 'LtorEq' | 'Conatains' | 'Contains';
  value: string;
  logicalOperator?: 'And' | 'Or';
}

/** Shared.Core ValueObjects.Sort */
export interface QuerySort {
  propertyName: string;
  isAscending: boolean;
}

/** Shared.Core ValueObjects.QueryCriteria */
export interface QueryCriteria {
  filters?: QueryFilter[];
  sorts?: QuerySort[];
  skip: number;
  take: number;
}

/** Shared.Core Wrappers.PaginatedResult<T> */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
}

export interface RoleModel {
  id: string;
  name: string;
  normalizedName?: string;
}

export interface UserAuditEntry {
  action: number;
  performedAtUtc: string;
  performedByUserId: string;
  details?: string | null;
}

/** Row shape of api/User/Get (admin list). */
export interface AdminUser {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  isActive: boolean;
  createdAtUtc?: string | null;
  lastModifiedAtUtc?: string | null;
  roleIds: string[];
  roles: string[];
}

/**
 * Shape of api/User/GetById (detail page + edit modal feed). Unlike the list
 * endpoint, roles come back as {id, name} pairs resolved from the backend.
 */
export interface AdminUserDetail {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  isActive: boolean;
  address?: string | null;
  avatarImagePath?: string | null;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  createdAtUtc?: string | null;
  createdByUserId?: string | null;
  lastModifiedAtUtc?: string | null;
  lastModifiedByUserId?: string | null;
  roleIds: string[];
  roles: RoleModel[];
  recentActivity?: UserAuditEntry[];
}

/** api/User/Create payload. */
export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  userName?: string;
  phoneNumber?: string;
  password: string;
  roles: string[];
}

/** api/User/Edit payload. */
export interface EditUserPayload {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  roles: string[];
}

/** IdentityUserAuditAction values (Identity.Domain.Enums.UserAuditAction). */
export const USER_AUDIT_ACTION_LABELS: Record<number, string> = {
  1: 'Created',
  2: 'Updated',
  3: 'Roles changed',
  4: 'Activated',
  5: 'Deactivated',
  6: 'Password reset',
  7: 'Deleted',
};
