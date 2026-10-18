/** Shared policy map. The API remains the authorization enforcement point. */
export const rolePermissions = Object.freeze({
  owner: Object.freeze([
    "overview", "checkout", "inventory:read", "inventory:write",
    "inventory:report", "catalog:write", "sales:read", "team:read",
    "team:write", "stores:write", "customers:read", "customers:write",
  ]),
  manager: Object.freeze([
    "overview", "checkout", "inventory:read", "inventory:write",
    "inventory:report", "catalog:write", "sales:read", "team:read",
    "team:write", "customers:read", "customers:write",
  ]),
  cashier: Object.freeze([
    "overview", "checkout", "inventory:read", "sales:own",
    "customers:read", "customers:write",
  ]),
});

export function roleCan(role, permission) {
  return rolePermissions[role]?.includes(permission) ?? false;
}
