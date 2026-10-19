/**
 * Shared same-origin API client for the POS workspace.
 * Keeps store selection and session credentials consistent for every feature.
 */
export async function requestApi(path, options = {}) {
  const activeStoreId = localStorage.getItem("counterpoint-active-store");
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(activeStoreId ? { "X-Store-Id": activeStoreId } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  let payload = null;
  if (response.headers.get("content-type")?.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      payload?.error ??
      (response.status >= 500
        ? `The store service is temporarily unavailable (HTTP ${response.status}).`
        : `The store service returned an unexpected response (HTTP ${response.status}).`);
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.code ?? "HTTP_ERROR";
    error.quote = payload?.quote;
    throw error;
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("The store service returned an invalid response.");
  }
  return payload;
}
