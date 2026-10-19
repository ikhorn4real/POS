export const rolePermissions = Object.freeze({
  owner: Object.freeze([
    "overview", "checkout", "inventory:read", "inventory:write",
    "inventory:report", "catalog:write", "sales:read", "team:read",
    "team:write", "stores:write", "customers:read", "customers:write",
  ] as const),
  manager: Object.freeze([
    "overview", "checkout", "inventory:read", "inventory:write",
    "inventory:report", "catalog:write", "sales:read", "team:read",
    "team:write", "customers:read", "customers:write",
  ] as const),
  cashier: Object.freeze([
    "overview", "checkout", "inventory:read", "sales:own",
    "customers:read", "customers:write",
  ] as const),
});

export type Role = keyof typeof rolePermissions;

type PermissionByRole = {
  [RoleName in Role]: (typeof rolePermissions)[RoleName][number];
};

export type Permission = PermissionByRole[Role];

export function roleCan<RoleName extends Role>(
  role: RoleName,
  permission: PermissionByRole[RoleName],
): boolean {
  const allowed = rolePermissions[role] as readonly Permission[] | undefined;
  return allowed?.includes(permission) ?? false;
}
