import { requestApi } from "../../shared/api-client.js";

export async function listCustomers() {
  return requestApi("/customers");
}

export async function createCustomer(customer) {
  return requestApi("/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

export async function updateCustomer(id, customer) {
  return requestApi(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customer),
  });
}

export async function getCustomerHistory(id, page = 1, pageSize = 50) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return requestApi(`/customers/${id}/history?${params}`);
}
