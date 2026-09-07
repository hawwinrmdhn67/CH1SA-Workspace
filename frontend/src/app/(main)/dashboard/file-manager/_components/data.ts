import { File, FileArchive, FileChartColumn, FileImage, FileText } from "lucide-react";

export type FileKind = "document" | "spreadsheet" | "design" | "pdf" | "archive" | "image" | "other";
export type FileManagerView = "grid" | "list";

export const fileIcons = {
  archive: FileArchive,
  design: FileImage,
  document: FileText,
  image: FileImage,
  other: File,
  pdf: File,
  spreadsheet: FileChartColumn,
} satisfies Record<FileKind, typeof File>;

export const fileKindLabels: Record<FileKind, string> = {
  archive: "Archive",
  design: "Design",
  document: "Document",
  image: "Image",
  other: "File",
  pdf: "PDF",
  spreadsheet: "Spreadsheet",
};

export interface FileManagerFolder {
  id: string;
  name: string;
  fileCount: number;
  size: string;
  updatedAt: string;
  starred: boolean;
}

export interface FileManagerFile {
  id: string;
  name: string;
  kind: FileKind;
  size: string;
  owner: string;
  ownerInitials: string;
  modifiedAt: string;
  shared: boolean;
  starred: boolean;
}
