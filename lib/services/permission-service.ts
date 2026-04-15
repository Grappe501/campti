/**
 * P4-E — Role separation service.
 */
import {
  ROLE_PERMISSION_MATRIX,
  type ProductRole,
} from "@/lib/domain/role-permissions";
import { getOrCreateReaderEntitlement } from "@/lib/services/reader-entitlement-service";

export function canAccessAuthorMode(role: ProductRole): boolean {
  return ROLE_PERMISSION_MATRIX[role].canAccessAuthorMode;
}

export function canAccessAdminTools(role: ProductRole): boolean {
  return ROLE_PERMISSION_MATRIX[role].canAccessAdminTools;
}

export function canUsePremiumFeatures(role: ProductRole): boolean {
  return ROLE_PERMISSION_MATRIX[role].canUsePremiumFeatures;
}

export async function resolveReaderRole(readerId: string): Promise<ProductRole> {
  const entitlement = await getOrCreateReaderEntitlement(readerId);
  if (entitlement.planType === "premium" || entitlement.planType === "standard") {
    return "subscriber";
  }
  if (entitlement.planType === "admin") return "admin";
  if (entitlement.planType === "internal") return "internal";
  return "reader";
}

