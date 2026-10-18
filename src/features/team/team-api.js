import { requestApi } from "../../shared/api-client.js";

export async function listTeamMembers() {
  return requestApi("/users");
}

export async function createTeamMember(member) {
  return requestApi("/users", { method: "POST", body: JSON.stringify(member) });
}

export async function updateTeamMember(id, member) {
  return requestApi(`/users/${id}`, { method: "PUT", body: JSON.stringify(member) });
}

export async function resetTeamMemberPassword(id) {
  return requestApi(`/users/${id}/password-reset`, { method: "POST" });
}
