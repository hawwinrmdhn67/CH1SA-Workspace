import { fetchApi } from "./client";

export interface FileData {
  id: string;
  name: string;
  folderId: string | null;
  kind: string;
  size: number;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderData {
  id: string;
  name: string;
  parentId: string | null;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getFiles = async (): Promise<FileData[]> => {
  const response = await fetchApi("/files");
  return response.data;
};

export const createFile = async (file: Partial<FileData>): Promise<FileData> => {
  const response = await fetchApi("/files", {
    method: "POST",
    body: JSON.stringify(file),
  });
  return response.data;
};

export const updateFile = async (id: string, file: Partial<FileData>): Promise<FileData> => {
  const response = await fetchApi(`/files/${id}`, {
    method: "PATCH",
    body: JSON.stringify(file),
  });
  return response.data;
};

export const deleteFile = async (id: string): Promise<void> => {
  await fetchApi(`/files/${id}`, {
    method: "DELETE",
  });
};

export const getFolders = async (): Promise<FolderData[]> => {
  const response = await fetchApi("/folders");
  return response.data;
};

export const createFolder = async (folder: Partial<FolderData>): Promise<FolderData> => {
  const response = await fetchApi("/folders", {
    method: "POST",
    body: JSON.stringify(folder),
  });
  return response.data;
};

export const updateFolder = async (id: string, folder: Partial<FolderData>): Promise<FolderData> => {
  const response = await fetchApi(`/folders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(folder),
  });
  return response.data;
};

export const deleteFolder = async (id: string): Promise<void> => {
  await fetchApi(`/folders/${id}`, {
    method: "DELETE",
  });
};
