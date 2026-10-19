import { requestApi } from "../../shared/api-client.js";

export function listSales({ page = 1, pageSize = 50, search = "", dateFrom = "", dateTo = "" } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set("search", search);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  return requestApi(`/sales?${params}`);
}

export function getSale(saleId) {
  return requestApi(`/sales/${saleId}`);
}

export function getSalesSummary(range) {
  return requestApi(`/sales/summary?${new URLSearchParams(range)}`);
}
