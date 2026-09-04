import { fetchApi } from "./client";

export async function login(password: string) {
  return fetchApi("/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
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

export async function resetPassword(recoveryCode: string, password: string): Promise<void> {
  await fetchApi("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ recoveryCode, password }),
  });
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
