import { fetchApi } from "./client";

export interface SubtaskDTO {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  subtasks?: SubtaskDTO[];
  created_at: string;
  updated_at: string;
}

export async function getTasks(): Promise<TaskDTO[]> {
  const response = await fetchApi("/tasks");
  return response.data;
}

export async function getTask(id: string): Promise<TaskDTO> {
  const response = await fetchApi(`/tasks/${id}`);
  return response.data;
}

export async function createTask(task: Partial<TaskDTO>): Promise<TaskDTO> {
  const response = await fetchApi("/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
  return response.data;
}

export async function updateTask(id: string, updates: Partial<TaskDTO>): Promise<TaskDTO> {
  const response = await fetchApi(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return response.data;
}

export async function deleteTask(id: string): Promise<void> {
  await fetchApi(`/tasks/${id}`, {
    method: "DELETE",
  });
}
