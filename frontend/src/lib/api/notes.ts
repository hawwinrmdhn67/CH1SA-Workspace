import { fetchApi } from "./client";

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function getNotes(): Promise<Note[]> {
  const response = await fetchApi("/notes");
  return response.data;
}

export async function getNote(id: string): Promise<Note> {
  const response = await fetchApi(`/notes/${id}`);
  return response.data;
}

export async function createNote(note: Partial<Note>): Promise<Note> {
  const response = await fetchApi("/notes", {
    method: "POST",
    body: JSON.stringify(note),
  });
  return response.data;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  const response = await fetchApi(`/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return response.data;
}

export async function deleteNote(id: string): Promise<void> {
  await fetchApi(`/notes/${id}`, {
    method: "DELETE",
  });
}
