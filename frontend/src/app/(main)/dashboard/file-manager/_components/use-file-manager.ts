import { create } from "zustand";

import * as api from "@/lib/api/files";

import {
  type DBFile,
  type DBFolder,
  deleteFileDB,
  getAllFiles, // only for syncing blobs
  saveFile,
} from "./file-manager-db";

function parseSize(sizeStr: string): number {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();
  if (unit === "KB") return val * 1024;
  if (unit === "MB") return val * 1024 * 1024;
  if (unit === "GB") return val * 1024 * 1024 * 1024;
  return val;
}

export interface ActionModalState {
  type: "rename" | "move" | "delete" | "preview" | null;
  itemType: "file" | "folder" | null;
  itemId: string | null;
}

export interface FileManagerState {
  isInitialized: boolean;
  folders: DBFolder[];
  files: DBFile[];
  currentFolderId: string | null;
  searchQuery: string;
  filterType: string;
  sortType: string;
  view: "grid" | "list";
  modalState: ActionModalState;

  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  setCurrentFolder: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string) => void;
  setSortType: (type: string) => void;
  setView: (view: "grid" | "list") => void;
  setModalState: (state: Partial<ActionModalState>) => void;

  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  toggleStarFolder: (id: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  uploadFile: (file: File, folderId: string | null) => Promise<void>;
  renameFile: (id: string, name: string) => Promise<void>;
  toggleStarFile: (id: string) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  moveFile: (id: string, newFolderId: string | null) => Promise<void>;
}

export const useFileManager = create<FileManagerState>((set, get) => ({
  isInitialized: false,
  folders: [],
  files: [],
  currentFolderId: null,
  searchQuery: "",
  filterType: "all",
  sortType: "modified",
  view: "grid",
  modalState: { type: null, itemType: null, itemId: null },

  refresh: async () => {
    try {
      const apiFolders = await api.getFolders();
      const apiFiles = await api.getFiles();

      const dbFolders: DBFolder[] = apiFolders.map((f) => ({
        id: f.id,
        name: f.name,
        parentId: f.parentId,
        starred: f.isStarred,
        createdAt: new Date(f.createdAt).getTime(),
        updatedAt: new Date(f.updatedAt).getTime(),
      }));

      const localFiles = await getAllFiles();
      const localFilesMap = new Map(localFiles.map((f) => [f.id, f]));

      const dbFiles: DBFile[] = apiFiles.map((f) => {
        const local = localFilesMap.get(f.id);
        return {
          id: f.id,
          name: f.name,
          kind: f.kind as any,
          size: f.size,
          folderId: f.folderId,
          starred: f.isStarred,
          createdAt: new Date(f.createdAt).getTime(),
          modifiedAt: new Date(f.updatedAt).getTime(),
          blob: local?.blob,
        };
      });

      set({ folders: dbFolders, files: dbFiles, isInitialized: true });
    } catch (e) {
      console.error("Failed to fetch File Manager data:", e);
    }
  },

  initialize: async () => {
    if (get().isInitialized) return;
    await get().refresh();
  },

  setCurrentFolder: (id) => set({ currentFolderId: id, searchQuery: "" }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
  setSortType: (type) => set({ sortType: type }),
  setView: (view) => set({ view }),
  setModalState: (state) => set((prev) => ({ modalState: { ...prev.modalState, ...state } })),

  createFolder: async (name, parentId = null) => {
    try {
      const pId = parentId || get().currentFolderId;
      const apiFolder = await api.createFolder({ name, parentId: pId });

      const newFolder: DBFolder = {
        id: apiFolder.id,
        name: apiFolder.name,
        parentId: apiFolder.parentId,
        starred: apiFolder.isStarred,
        createdAt: new Date(apiFolder.createdAt).getTime(),
        updatedAt: new Date(apiFolder.updatedAt).getTime(),
      };

      set((state) => ({ folders: [...state.folders, newFolder] }));
    } catch (e) {
      console.error("Failed to create folder", e);
    }
  },

  renameFolder: async (id, name) => {
    try {
      await api.updateFolder(id, { name });
      const folder = get().folders.find((f) => f.id === id);
      if (!folder) return;
      const updated = { ...folder, name, updatedAt: Date.now() };
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updated : f)),
      }));
    } catch (e) {
      console.error("Failed to rename folder", e);
    }
  },

  toggleStarFolder: async (id) => {
    const folder = get().folders.find((f) => f.id === id);
    if (!folder) return;
    try {
      await api.updateFolder(id, { isStarred: !folder.starred });
      const updated = { ...folder, starred: !folder.starred, updatedAt: Date.now() };
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updated : f)),
      }));
    } catch (e) {
      console.error("Failed to toggle folder star", e);
    }
  },

  deleteFolder: async (id) => {
    try {
      await api.deleteFolder(id);

      const state = get();
      const getDescendantFolderIds = (folderId: string): string[] => {
        const children = state.folders.filter((f) => f.parentId === folderId).map((f) => f.id);
        return [folderId, ...children.flatMap(getDescendantFolderIds)];
      };
      const deletedFolderIds = getDescendantFolderIds(id);

      // We still need to delete local blobs from IndexedDB for ALL affected files
      const filesToDelete = state.files.filter((f) => f.folderId && deletedFolderIds.includes(f.folderId));
      for (const file of filesToDelete) {
        await deleteFileDB(file.id);
      }

      set((state) => {
        const remainingFolders = state.folders.filter((f) => !deletedFolderIds.includes(f.id));
        const remainingFiles = state.files.filter((f) => !f.folderId || !deletedFolderIds.includes(f.folderId));

        // Determine the nearest valid parent if we are inside the deleted tree
        let newCurrentFolderId = state.currentFolderId;
        if (newCurrentFolderId && deletedFolderIds.includes(newCurrentFolderId)) {
          // If we were viewing a folder that just got deleted, move to the parent of the root deleted folder
          const rootDeletedFolder = state.folders.find((f) => f.id === id);
          newCurrentFolderId = rootDeletedFolder ? rootDeletedFolder.parentId : null;
        }

        return {
          folders: remainingFolders,
          files: remainingFiles,
          currentFolderId: newCurrentFolderId,
        };
      });
    } catch (e) {
      console.error("Failed to delete folder", e);
    }
  },

  uploadFile: async (file, folderId) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let kind: DBFile["kind"] = "other";
    if (ext?.match(/^(jpg|jpeg|png|webp|gif|svg)$/)) kind = "image";
    else if (ext?.match(/^(pdf)$/)) kind = "pdf";
    else if (ext?.match(/^(doc|docx|txt|md)$/)) kind = "document";
    else if (ext?.match(/^(xls|xlsx|csv)$/)) kind = "spreadsheet";
    else if (ext?.match(/^(zip|rar|tar|gz)$/)) kind = "archive";

    try {
      const fId = folderId || get().currentFolderId;

      const apiFile = await api.createFile({
        name: file.name,
        kind,
        size: file.size,
        folderId: fId,
        isStarred: false,
      });

      const newFile: DBFile = {
        id: apiFile.id,
        name: apiFile.name,
        kind,
        size: apiFile.size,
        folderId: apiFile.folderId,
        starred: apiFile.isStarred,
        createdAt: new Date(apiFile.createdAt).getTime(),
        modifiedAt: new Date(apiFile.updatedAt).getTime(),
        blob: file, // Save Blob instance to IndexedDB
      };

      await saveFile(newFile);
      set((state) => ({ files: [...state.files, newFile] }));
    } catch (e) {
      console.error("Failed to upload file", e);
    }
  },

  renameFile: async (id, name) => {
    try {
      await api.updateFile(id, { name });
      const file = get().files.find((f) => f.id === id);
      if (!file) return;
      const updated = { ...file, name, modifiedAt: Date.now() };
      await saveFile(updated);
      set((state) => ({
        files: state.files.map((f) => (f.id === id ? updated : f)),
      }));
    } catch (e) {
      console.error("Failed to rename file", e);
    }
  },

  toggleStarFile: async (id) => {
    const file = get().files.find((f) => f.id === id);
    if (!file) return;
    try {
      await api.updateFile(id, { isStarred: !file.starred });
      const updated = { ...file, starred: !file.starred };
      await saveFile(updated);
      set((state) => ({
        files: state.files.map((f) => (f.id === id ? updated : f)),
      }));
    } catch (e) {
      console.error("Failed to toggle file star", e);
    }
  },

  deleteFile: async (id) => {
    try {
      await api.deleteFile(id);
      await deleteFileDB(id);
      set((state) => ({
        files: state.files.filter((f) => f.id !== id),
      }));
    } catch (e) {
      console.error("Failed to delete file", e);
    }
  },

  moveFile: async (id, newFolderId) => {
    try {
      await api.updateFile(id, { folderId: newFolderId });
      const file = get().files.find((f) => f.id === id);
      if (!file) return;
      const updated = { ...file, folderId: newFolderId, modifiedAt: Date.now() };
      await saveFile(updated);
      set((state) => ({
        files: state.files.map((f) => (f.id === id ? updated : f)),
      }));
    } catch (e) {
      console.error("Failed to move file", e);
    }
  },
}));
