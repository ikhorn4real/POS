import { roleCan } from "../../shared/permissions.js";

const pagePermissions = Object.freeze({
  overview: ["overview"],
  checkout: ["checkout"],
  inventory: ["inventory:read"],
  "stock-report": ["inventory:report"],
  suppliers: ["catalog:write"],
  categories: ["catalog:write"],
  customers: ["customers:read"],
  sales: ["sales:read", "sales:own"],
  settings: ["team:read", "stores:write"],
});

export function canOpenPage(role, page, isDemo = false) {
  if (isDemo) return true;
  const required = pagePermissions[page];
  return Boolean(required?.some((capability) => roleCan(role, capability)));
}

export function getVisiblePages(role, pages, isDemo = false) {
  return pages.filter((page) => canOpenPage(role, page.id, isDemo));
}
