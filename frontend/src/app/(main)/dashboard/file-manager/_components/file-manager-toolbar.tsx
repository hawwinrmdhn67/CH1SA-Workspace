import { ArrowUpDown, Grid2X2, List, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useFileManager } from "./use-file-manager";

export function FileManagerToolbar() {
  const { filterType, setFilterType, sortType, setSortType, view, setView } = useFileManager();

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          value={view}
          onValueChange={(v) => v && setView(v as any)}
          aria-label="File view"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid2X2 />
            Grid View
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List />
            List View
          </ToggleGroupItem>
        </ToggleGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal data-icon="inline-start" />
              Filter & sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={filterType} onValueChange={setFilterType}>
                <DropdownMenuRadioItem value="all">All files</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="starred">Starred</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="shared">Shared</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <SlidersHorizontal />
                  File type
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value={filterType} onValueChange={setFilterType}>
                      <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="archive">Archive</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="design">Design</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="document">Document</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="pdf">PDF</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="spreadsheet">Spreadsheet</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown />
                  Sort by
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value={sortType} onValueChange={setSortType}>
                      <DropdownMenuRadioItem value="modified">Last modified</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="size">File size</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
