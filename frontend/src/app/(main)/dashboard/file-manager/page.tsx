"use client";

import * as React from "react";

import { format, formatDistanceToNow } from "date-fns";
import { ChevronRight, FolderPlus, Grid2X2, Home, List, Search, Upload } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { ActionModals } from "./_components/action-modals";
import { CreateFolderModal } from "./_components/create-folder-modal";
import type { FileManagerFile, FileManagerFolder } from "./_components/data";
import { FileGridView } from "./_components/file-grid-view";
import { FileListView } from "./_components/file-list-view";
import { FileManagerToolbar } from "./_components/file-manager-toolbar";
import { FoldersSection } from "./_components/folders-section";
import { useFileManager } from "./_components/use-file-manager";

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  if (now.getTime() - date.getTime() < 48 * 60 * 60 * 1000) {
    return "Yesterday";
  }
  return format(date, "MMM d");
}

export default function Page() {
  const {
    isInitialized,
    initialize,
    folders,
    files,
    currentFolderId,
    setCurrentFolder,
    view,
    setView,
    searchQuery,
    setSearchQuery,
    filterType,
    sortType,
    uploadFile,
  } = useFileManager();

  const [createModalOpen, setCreateModalOpen] = React.useState(false);

  React.useEffect(() => {
    initialize();

    const handleUpdate = () => {
      useFileManager.getState().refresh();
    };
    window.addEventListener("workspace_updated", handleUpdate);
    return () => window.removeEventListener("workspace_updated", handleUpdate);
  }, [initialize]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isInitialized) {
    return <div className="flex h-[400px] items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const breadcrumbs: { id: string; name: string }[] = [];
  let curr = currentFolderId;
  while (curr) {
    const f = folders.find((folder) => folder.id === curr);
    if (f) {
      breadcrumbs.unshift({ id: f.id, name: f.name });
      curr = f.parentId;
    } else {
      break;
    }
  }

  let visibleFolders = folders.filter((f) => f.parentId === currentFolderId);
  if (searchQuery) {
    visibleFolders = folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  if (filterType !== "all") {
    if (filterType === "starred") visibleFolders = visibleFolders.filter((f) => f.starred);
    else if (filterType === "shared") visibleFolders = visibleFolders.filter((f) => false);
  }

  visibleFolders.sort((a, b) => {
    if (sortType === "name") return a.name.localeCompare(b.name);
    if (sortType === "size") {
      const getFolderSize = (folderId: string) => {
        return files.filter((file) => file.folderId === folderId).reduce((acc, file) => acc + file.size, 0);
      };
      return getFolderSize(b.id) - getFolderSize(a.id);
    }
    return b.updatedAt - a.updatedAt;
  });

  const uiFolders: FileManagerFolder[] = visibleFolders.map((f) => {
    const childFiles = files.filter((file) => file.folderId === f.id);
    const totalSize = childFiles.reduce((acc, file) => acc + file.size, 0);
    return {
      id: f.id,
      name: f.name,
      fileCount: childFiles.length,
      size: formatBytes(totalSize),
      updatedAt: formatDate(f.updatedAt),
      starred: !!f.starred,
    };
  });

  let visibleFiles = files;

  if (searchQuery) {
    visibleFiles = visibleFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  } else {
    visibleFiles = visibleFiles.filter((f) => f.folderId === currentFolderId);
  }

  if (filterType !== "all") {
    if (filterType === "starred") visibleFiles = visibleFiles.filter((f) => f.starred);
    else if (filterType === "shared")
      visibleFiles = visibleFiles.filter((f) => false); 
    else visibleFiles = visibleFiles.filter((f) => f.kind === filterType);
  }

  visibleFiles.sort((a, b) => {
    if (sortType === "name") return a.name.localeCompare(b.name);
    if (sortType === "size") return b.size - a.size;
    return b.modifiedAt - a.modifiedAt;
  });

  const uiFiles: FileManagerFile[] = visibleFiles.map((f) => ({
    id: f.id,
    name: f.name,
    kind: f.kind as any,
    size: formatBytes(f.size),
    owner: "Me",
    ownerInitials: "ME",
    modifiedAt: formatDate(f.modifiedAt),
    shared: false,
    starred: f.starred,
  }));

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const selectedFiles = Array.from(e.target.files);
    for (const file of selectedFiles) {
      await uploadFile(file, currentFolderId);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      for (const file of droppedFiles) {
        await uploadFile(file, currentFolderId);
      }
    }
  };

  return (
    <div
      className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col overflow-hidden"
      data-content-padding="false"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex shrink-0 flex-col gap-4 border-b px-4 py-4 lg:px-6">
        {breadcrumbs.length > 0 && (
          <div className="flex flex-col gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    asChild
                    className="cursor-pointer text-xl font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setCurrentFolder(null)}
                  >
                    <span>
                      <Home className="size-5" />
                    </span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((b, i) => (
                  <React.Fragment key={b.id}>
                    <BreadcrumbSeparator>
                      <ChevronRight className="size-5" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      {i === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="text-3xl font-medium tracking-tight">{b.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="cursor-pointer text-xl font-medium text-muted-foreground hover:text-foreground"
                          onClick={() => setCurrentFolder(b.id)}
                        >
                          <span>{b.name}</span>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FileManagerToolbar />
          <div className="flex flex-wrap items-center gap-2">
            <InputGroup className="w-full sm:w-64">
              <InputGroupInput
                placeholder="Search files and folders..."
                aria-label="Search files and folders"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
            <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
              <FolderPlus data-icon="inline-start" />
              New folder
            </Button>
            <Button onClick={handleUploadClick}>
              <Upload data-icon="inline-start" />
              Upload
            </Button>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-4 [scrollbar-color:var(--border)_transparent] lg:px-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
        {uiFolders.length === 0 && uiFiles.length === 0 ? (
          <Empty className="min-h-64 mt-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Upload />
              </EmptyMedia>
              <EmptyTitle>
                {searchQuery
                  ? "No results found"
                  : filterType === "starred"
                    ? "No starred items"
                    : "No files or folders yet"}
              </EmptyTitle>
              <EmptyDescription>
                {searchQuery
                  ? "Try adjusting your search or filters."
                  : filterType === "starred"
                    ? "Star files or folders to find them here."
                    : "Create a folder or upload a file to get started."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {uiFolders.length > 0 && <FoldersSection folders={uiFolders} view={view} />}

            {uiFiles.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="sticky top-0 z-10 -mx-4 px-4 lg:-mx-6 lg:px-6 py-3 min-h-[56px] bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 flex items-center justify-between gap-4 border-b">
                  <h2 className="font-medium text-lg">
                    {searchQuery ? `Search results for "${searchQuery}"` : "All files"}
                  </h2>
                  <span className="text-muted-foreground text-sm">
                    {uiFiles.length} {uiFiles.length === 1 ? "file" : "files"}
                  </span>
                </div>
                {view === "list" ? <FileListView files={uiFiles} /> : <FileGridView files={uiFiles} />}
              </section>
            )}
          </>
        )}
      </div>
      <CreateFolderModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      <ActionModals />
    </div>
  );
}
