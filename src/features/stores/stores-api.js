import { requestApi } from "../../shared/api-client.js";

export async function listStores({ includeInactive = false } = {}) {
  return requestApi(includeInactive ? "/stores?includeInactive=true" : "/stores");
}

export async function saveStore(id, store) {
  return requestApi(id ? `/stores/${id}` : "/stores", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(store),
  });
}
