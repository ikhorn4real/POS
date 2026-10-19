import { requestApi } from "../../shared/api-client.js";

export function getSession() {
  return requestApi("/auth/session");
}

export function signIn(email, password) {
  return requestApi("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signOut() {
  return requestApi("/auth/logout", { method: "POST" });
}

export function changePassword({ currentPassword, newPassword }) {
  return requestApi("/auth/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
