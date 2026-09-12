"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { type FileManagerFile, fileIcons, fileKindLabels } from "./data";
import { FileActions } from "./file-actions";
import { useFileManager } from "./use-file-manager";

interface FileGridViewProps {
  files: FileManagerFile[];
}

export function FileGridView({ files }: FileGridViewProps) {
  const { toggleStarFile, setModalState } = useFileManager();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {files.map((file) => {
        const FileIcon = (fileIcons as any)[file.kind] || fileIcons.document;

        return (
          <Card
            key={file.id}
            size="sm"
            className="group/file cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setModalState({ type: "preview", itemType: "file", itemId: file.id })}
          >
            <CardContent>
              <div className="relative flex h-36 items-center justify-center rounded-lg bg-muted/50 overflow-hidden">
                <FileIcon className="size-12 text-muted-foreground" aria-hidden="true" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    "absolute top-2 right-2 opacity-0 focus-visible:opacity-100 group-hover/file:opacity-100",
                    file.starred && "opacity-100",
                  )}
                  aria-label={file.starred ? `Unstar ${file.name}` : `Star ${file.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStarFile(file.id);
                  }}
                >
                  <Star className={cn("size-4", file.starred && "fill-foreground")} />
                </Button>
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 text-muted-foreground text-xs">
                  <span>{fileKindLabels[file.kind] || "File"}</span>
                  <span>{file.size}</span>
                </div>
              </div>
            </CardContent>
            <CardHeader>
              <CardTitle className="truncate">{file.name}</CardTitle>
              <CardAction>
                <FileActions file={file} />
              </CardAction>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
