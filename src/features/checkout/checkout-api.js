import { requestApi } from "../../shared/api-client.js";

export function quoteSale(items) {
  return requestApi("/sales/quote", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export function submitCashSale(payload, idempotencyKey) {
  return requestApi("/sales", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
}
