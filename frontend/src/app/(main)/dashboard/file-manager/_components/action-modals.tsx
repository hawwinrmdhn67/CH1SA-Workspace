import * as React from "react";

import { Download } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useFileManager } from "./use-file-manager";

export function ActionModals() {
  const { modalState, setModalState, folders, files, renameFolder, renameFile, deleteFolder, deleteFile, moveFile } =
    useFileManager();

  const { type, itemType, itemId } = modalState;

  const item = React.useMemo(() => {
    if (!itemId || !itemType) return null;
    if (itemType === "folder") return folders.find((f) => f.id === itemId);
    if (itemType === "file") return files.find((f) => f.id === itemId);
    return null;
  }, [itemId, itemType, folders, files]);

  const [name, setName] = React.useState("");
  const [targetFolderId, setTargetFolderId] = React.useState<string>("root");

  React.useEffect(() => {
    if (type === "rename" && item) {
      setName(item.name);
    }
    if (type === "move" && itemType === "file" && item) {
      setTargetFolderId((item as any).folderId || "root");
    }
  }, [type, item]);

  const close = () => setModalState({ type: null, itemType: null, itemId: null });

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !itemId) return;
    if (itemType === "folder") await renameFolder(itemId, name.trim());
    if (itemType === "file") await renameFile(itemId, name.trim());
    close();
  };

  const handleDelete = async () => {
    if (!itemId) return;
    if (itemType === "folder") await deleteFolder(itemId);
    if (itemType === "file") await deleteFile(itemId);
    close();
  };

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;
    const dest = targetFolderId === "root" ? null : targetFolderId;
    if (itemType === "file") await moveFile(itemId, dest);
    close();
  };

  const handleDownload = () => {
    if (itemType === "file" && item && (item as any).blob) {
      const url = URL.createObjectURL((item as any).blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderPreview = () => {
    if (itemType !== "file" || !item) return null;
    const file = item as any;
    if (!file.blob) return <p>No file data available.</p>;

    if (file.kind === "image") {
      const url = URL.createObjectURL(file.blob);
      return <img src={url} alt={file.name} className="max-h-[60vh] object-contain rounded-md mx-auto" />;
    }

    if (file.kind === "pdf") {
      const url = URL.createObjectURL(file.blob);
      return <iframe src={url} title={`Preview of ${file.name}`} className="w-full h-[60vh] rounded-md" />;
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
        <p className="text-muted-foreground">Preview not supported for this file type.</p>
        <Button onClick={handleDownload}>
          <Download data-icon="inline-start" /> Download File
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* Rename Modal */}
      <Dialog open={type === "rename"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename {itemType}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="renameName">Name</Label>
                <Input id="renameName" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || name === item?.name}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Modal */}
      <Dialog open={type === "move"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleMove}>
            <DialogHeader>
              <DialogTitle>Move "{item?.name}"</DialogTitle>
              <DialogDescription>Choose a destination folder.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Select value={targetFolderId} onValueChange={setTargetFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">My files (Root)</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">Move</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={type === "preview"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col">
          <DialogHeader className="min-w-0 shrink-0 pr-8">
            <DialogTitle className="truncate" title={item?.name}>
              {item?.name}
            </DialogTitle>
            <DialogDescription>{itemType === "file" && `${(item as any).size} bytes`}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-md bg-muted/20">
            {renderPreview()}
          </div>
          <DialogFooter className="shrink-0">
            {itemType === "file" && (item as any)?.kind !== "other" && (
              <Button onClick={handleDownload}>
                <Download data-icon="inline-start" /> Download
              </Button>
            )}
            <Button variant="outline" onClick={close}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={type === "delete"} onOpenChange={(open) => !open && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemType}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item?.name}"?
              {itemType === "folder" && " This will also delete any files inside it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={close}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
