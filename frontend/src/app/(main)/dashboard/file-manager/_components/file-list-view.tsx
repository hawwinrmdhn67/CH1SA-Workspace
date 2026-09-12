"use client";

import { useState } from "react";

import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { type FileManagerFile, fileIcons, fileKindLabels } from "./data";
import { FileActions } from "./file-actions";
import { useFileManager } from "./use-file-manager";

interface FileListViewProps {
  files: FileManagerFile[];
}

export function FileListView({ files }: FileListViewProps) {
  const { toggleStarFile, setModalState } = useFileManager();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-0 w-[50%] lg:w-[40%]">Name</TableHead>
          <TableHead className="hidden sm:table-cell w-[20%] lg:w-[15%]">Type</TableHead>
          <TableHead className="hidden lg:table-cell w-[20%] lg:w-[15%]">Modified</TableHead>
          <TableHead className="hidden md:table-cell w-[20%] lg:w-[15%]">Size</TableHead>
          <TableHead className="w-16">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => {
          const FileIcon = (fileIcons as any)[file.kind] || fileIcons.document;

          return (
            <TableRow
              key={file.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setModalState({ type: "preview", itemType: "file", itemId: file.id })}
            >
              <TableCell className="pl-0">
                <div className="flex min-w-0 items-center gap-3">
                  <FileIcon className="size-5 shrink-0 text-muted-foreground" />
                  <Button variant="link" size="sm" className="h-auto max-w-72 justify-start px-0">
                    <span className="truncate">{file.name}</span>
                  </Button>
                  {file.shared && (
                    <Badge variant="outline" className="hidden xl:inline-flex">
                      Shared
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">{fileKindLabels[file.kind] || "File"}</TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{file.modifiedAt}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{file.size}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={file.starred ? `Unstar ${file.name}` : `Star ${file.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarFile(file.id);
                    }}
                  >
                    <Star className={cn(file.starred && "fill-current")} />
                  </Button>
                  <FileActions file={file} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
