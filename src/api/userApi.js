
import { apiRequest } from "./axiosClient";
import { getUserId } from "./authApi";

export async function getCurrentUser() {
  const userId = getUserId();

  if (!userId) {
    throw new Error("User ID not found.");
  }

  return apiRequest(`/api/users/${userId}`);
}
