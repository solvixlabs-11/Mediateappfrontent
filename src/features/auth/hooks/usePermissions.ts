import { useAuthStore } from "../store";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const role = user?.role || "MR";
  const permissions = user?.permissions || [];

  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isMR = role === "MR";

  const hasPermission = (permissionCode: string): boolean => {
    if (isAdmin) return true;
    return permissions.includes(permissionCode);
  };

  return {
    role,
    permissions,
    isAdmin,
    isManager,
    isMR,
    hasPermission,
  };
}
