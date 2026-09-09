import { fetchApi } from "./client";
import type { User } from "@/hooks/use-auth";

export async function listUsers(): Promise<User[]> {
  const response = await fetchApi("/admin/users");
  if (!response || !Array.isArray(response)) return [];
  
  return response.map((u: any) => ({
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    role: u.role,
    isActive: u.is_active,
    mustChangePassword: u.must_change_password,
  }));
}

export async function createUser(data: { username: string; role: string; isActive: boolean; password?: string }): Promise<User> {
  const response = await fetchApi("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response;
}

export async function updateUser(id: string, data: { username?: string; role?: string; isActive?: boolean }): Promise<User> {
  const response = await fetchApi(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await fetchApi(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export async function resetUserPassword(id: string, data: { password?: string; mustChangePassword?: boolean }): Promise<void> {
  await fetchApi(`/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
