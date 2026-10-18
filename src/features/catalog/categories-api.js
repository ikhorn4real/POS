import { requestApi } from "../../shared/api-client.js";

export async function listCategories() {
  return requestApi("/categories");
}

export async function createCategory(name) {
  return requestApi("/categories", { method: "POST", body: JSON.stringify({ name }) });
}

export async function updateCategory(id, name) {
  return requestApi(`/categories/${id}`, { method: "PUT", body: JSON.stringify({ name }) });
}
