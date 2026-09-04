import { Clock, Folder, MoreVertical, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { FileManagerFolder } from "./data";
import { useFileManager } from "./use-file-manager";

interface FoldersSectionProps {
  folders: FileManagerFolder[];
  view: "grid" | "list";
}

export function FoldersSection({ folders, view }: FoldersSectionProps) {
  const { setCurrentFolder, setModalState, toggleStarFolder } = useFileManager();
  return (
    <section className="flex flex-col gap-4" aria-labelledby="folders-heading">
      <div className="sticky top-0 z-10 -mx-4 px-4 lg:-mx-6 lg:px-6 py-3 min-h-[56px] bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 flex items-center justify-between border-b">
        <h2 className="font-medium text-lg">Folders</h2>
        <span className="text-muted-foreground text-sm">
          {folders.length} {folders.length === 1 ? "folder" : "folders"}
        </span>
      </div>
      {view === "list" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-0">Name</TableHead>
              <TableHead className="hidden sm:table-cell">Items</TableHead>
              <TableHead className="hidden lg:table-cell">Modified</TableHead>
              <TableHead className="hidden md:table-cell">Size</TableHead>
              <TableHead className="w-16">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {folders.map((folder) => (
              <TableRow key={folder.id} className="cursor-pointer group" onClick={() => setCurrentFolder(folder.id)}>
                <TableCell className="pl-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Folder className="size-4" />
                    </div>
                    <Button variant="link" size="sm" className="h-auto max-w-72 justify-start px-0" asChild>
                      <span className="truncate">{folder.name}</span>
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{folder.fileCount} files</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{folder.updatedAt}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{folder.size}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={folder.starred ? `Unstar ${folder.name}` : `Star ${folder.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarFolder(folder.id);
                      }}
                    >
                      <Star className={cn(folder.starred && "fill-current")} />
                    </Button>
                    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${folder.name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onSelect={() => setCurrentFolder(folder.id)}>
                              Open folder
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toggleStarFolder(folder.id)}>
                              {folder.starred ? "Remove from starred" : "Add to starred"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setModalState({ type: "rename", itemType: "folder", itemId: folder.id })}
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setModalState({ type: "delete", itemType: "folder", itemId: folder.id })}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              size="sm"
              className="cursor-pointer group hover:bg-muted/50 transition-colors"
              onClick={() => setCurrentFolder(folder.id)}
            >
              <CardHeader>
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Folder className="size-4.5" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle className="truncate leading-none">{folder.name}</CardTitle>
                    <CardDescription className="text-xs">{folder.fileCount} files</CardDescription>
                  </div>
                </div>
                <CardAction>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        "opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
                        folder.starred && "opacity-100",
                      )}
                      aria-label={folder.starred ? `Unstar ${folder.name}` : `Star ${folder.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarFolder(folder.id);
                      }}
                    >
                      <Star className={cn("size-4", folder.starred && "fill-current")} />
                    </Button>
                    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${folder.name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onSelect={() => setCurrentFolder(folder.id)}>
                              Open folder
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toggleStarFolder(folder.id)}>
                              {folder.starred ? "Remove from starred" : "Add to starred"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setModalState({ type: "rename", itemType: "folder", itemId: folder.id })}
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setModalState({ type: "delete", itemType: "folder", itemId: folder.id })}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3 text-muted-foreground text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>Updated {folder.updatedAt}</span>
                </div>
                <span>{folder.size}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
