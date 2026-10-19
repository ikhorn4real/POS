import { requestApi } from "../../shared/api-client.js";

export function listProducts() {
  return requestApi("/products");
}

export function createProduct(product) {
  return requestApi("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function updateProduct(id, product) {
  return requestApi(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export function adjustProductStock(id, quantity, reason) {
  return requestApi(`/products/${id}/stock-adjustments`, {
    method: "POST",
    body: JSON.stringify({ quantity, reason }),
  });
}

export function getInventoryReport() {
  return requestApi("/inventory/report");
}
