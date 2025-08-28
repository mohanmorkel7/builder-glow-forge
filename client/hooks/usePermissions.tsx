import React from "react";
import { useAuth } from "@/lib/auth-context";

export type Permission =
  | "admin"
  | "users"
  | "reports"
  | "settings"
  | "finops"
  | "billing"
  | "database"
  | "product"
  | "leads"
  | "vc";

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    // Admin role has all permissions
    if (user.role === "admin") return true;

    // Check department-based permissions
    if (user.permissions) {
      return user.permissions.includes(permission);
    }

    // Fallback to role-based permissions for backward compatibility
    const rolePermissions: Record<string, Permission[]> = {
      admin: [
        "admin",
        "users",
        "reports",
        "settings",
        "finops",
        "billing",
        "database",
        "product",
        "leads",
        "vc",
      ],
      sales: ["leads", "vc", "reports"],
      product: ["product", "leads", "vc"],
      development: ["admin", "product", "database", "leads", "vc"],
      db: ["admin", "database", "settings"],
      finops: ["finops", "reports", "billing"],
      finance: ["finops", "reports", "billing"],
      hr_management: ["users", "reports", "settings"],
      infra: ["admin", "settings", "database"],
    };

    const userRolePermissions = rolePermissions[user.role] || [];
    return userRolePermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  };

  const getUserDepartment = (): string | undefined => {
    return user?.department;
  };

  const getUserPermissions = (): string[] => {
    return user?.permissions || [];
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserDepartment,
    getUserPermissions,
    isAdmin: hasPermission("admin"),
    canManageUsers: hasPermission("users"),
    canViewReports: hasPermission("reports"),
    canManageSettings: hasPermission("settings"),
    canAccessFinOps: hasPermission("finops"),
    canAccessDatabase: hasPermission("database"),
    canAccessProduct: hasPermission("product"),
    canAccessLeads: hasPermission("leads"),
    canAccessVC: hasPermission("vc"),
  };
}

// Permission-based component wrapper
export function PermissionGate({
  permission,
  children,
  fallback,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return fallback || null;
  }

  return <>{children}</>;
}
