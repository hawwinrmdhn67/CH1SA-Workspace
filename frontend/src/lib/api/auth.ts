import { fetchApi } from "./client";

export async function login(username: string, password: string) {
  return fetchApi("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  return fetchApi("/auth/logout", {
    method: "POST",
  });
}

export async function me() {
  return fetchApi("/auth/me");
}

export async function resetPassword(username: string, recoveryCode: string, password: string): Promise<void> {
  await fetchApi("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ username, recoveryCode, password }),
  });
}

export async function verifyRecoveryCode(recoveryCode: string): Promise<string> {
  const response = await fetchApi("/auth/verify-recovery", {
    method: "POST",
    body: JSON.stringify({ recoveryCode }),
  });
  return response.data.username;
}

export async function getRecoveryCode(): Promise<string> {
  const response = await fetchApi("/auth/recovery");
  return response.data.code;
}

export async function generateRecoveryCode(): Promise<string> {
  const response = await fetchApi("/auth/recovery/generate", {
    method: "POST",
  });
  return response.data.code;
}

export async function checkAuth() {
  return fetchApi("/auth/me");
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await fetchApi("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function updateUsername(username: string): Promise<void> {
  await fetchApi("/auth/username", {
    method: "PATCH",
    body: JSON.stringify({ username }),
  });
}
