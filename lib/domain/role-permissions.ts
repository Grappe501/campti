/**
 * P4-E — Product roles and deterministic permission matrix.
 */
export const PRODUCT_ROLE_TYPES = [
  "reader",
  "subscriber",
  "author",
  "admin",
  "internal",
] as const;

export type ProductRole = (typeof PRODUCT_ROLE_TYPES)[number];

export type RolePermissions = {
  canAccessAuthorMode: boolean;
  canAccessAdminTools: boolean;
  canUsePremiumFeatures: boolean;
};

export const ROLE_PERMISSION_MATRIX: Record<ProductRole, RolePermissions> = {
  reader: {
    canAccessAuthorMode: false,
    canAccessAdminTools: false,
    canUsePremiumFeatures: false,
  },
  subscriber: {
    canAccessAuthorMode: false,
    canAccessAdminTools: false,
    canUsePremiumFeatures: true,
  },
  author: {
    canAccessAuthorMode: true,
    canAccessAdminTools: false,
    canUsePremiumFeatures: true,
  },
  admin: {
    canAccessAuthorMode: true,
    canAccessAdminTools: true,
    canUsePremiumFeatures: true,
  },
  internal: {
    canAccessAuthorMode: true,
    canAccessAdminTools: true,
    canUsePremiumFeatures: true,
  },
};

