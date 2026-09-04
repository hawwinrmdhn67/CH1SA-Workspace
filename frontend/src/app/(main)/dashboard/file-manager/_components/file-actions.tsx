import { Download, MoreVertical, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { FileManagerFile } from "./data";
import { useFileManager } from "./use-file-manager";

interface FileActionsProps {
  file: FileManagerFile;
}

export function FileActions({ file }: FileActionsProps) {
  const { setModalState, toggleStarFile, files } = useFileManager();

  const handleDownload = () => {
    const fullFile = files.find((f) => f.id === file.id);
    if (fullFile && fullFile.blob) {
      const url = URL.createObjectURL(fullFile.blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fullFile.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  return (
    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${file.name}`}>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setModalState({ type: "preview", itemType: "file", itemId: file.id })}>
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleStarFile(file.id)}>
              {file.starred ? "Remove from starred" : "Add to starred"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setModalState({ type: "rename", itemType: "file", itemId: file.id })}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setModalState({ type: "move", itemType: "file", itemId: file.id })}>
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleDownload}>Download</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setModalState({ type: "delete", itemType: "file", itemId: file.id })}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
