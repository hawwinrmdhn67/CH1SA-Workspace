import type { FileKind } from "./data";

export interface DBFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  starred?: boolean;
}

export interface DBFile {
  id: string;
  name: string;
  kind: FileKind | "image" | "other";
  size: number;
  folderId: string | null;
  starred: boolean;
  createdAt: number;
  modifiedAt: number;
  blob?: Blob | File;
}

const DB_NAME = "FileManagerDB";
const DB_VERSION = 1;
const FOLDERS_STORE = "folders";
const FILES_STORE = "files";

export function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
        db.createObjectStore(FOLDERS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getAllFiles(): Promise<DBFile[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, "readonly");
    const store = transaction.objectStore(FILES_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFile(file: DBFile): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, "readwrite");
    const store = transaction.objectStore(FILES_STORE);
    const request = store.put(file);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFileDB(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, "readwrite");
    const store = transaction.objectStore(FILES_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFileDB(id: string): Promise<DBFile | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, "readonly");
    const store = transaction.objectStore(FILES_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
