import { requestApi } from "../../shared/api-client.js";

export async function listSuppliers() {
  return requestApi("/suppliers");
}

export async function createSupplier(supplier) {
  return requestApi("/suppliers", { method: "POST", body: JSON.stringify(supplier) });
}

export async function updateSupplier(id, supplier) {
  return requestApi(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(supplier) });
}
