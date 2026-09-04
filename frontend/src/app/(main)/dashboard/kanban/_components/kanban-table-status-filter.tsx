"use client";
import type { ReactTable, RowData } from "@tanstack/react-table";
import { PlusCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { cn } from "@/lib/utils";

import { columns as boardColumns } from "./data";
import { stateConfig } from "./task-card";

interface TaskStatusFilterProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
}

export function TaskStatusFilter<TData extends RowData>({ table }: TaskStatusFilterProps<TData>) {
  const column = table.getColumn("state");

  if (!column) {
    return null;
  }

  const statusColumn = column;
  const selectedValues = new Set(statusColumn.getFilterValue() as string[]);

  function updateFilter(value: string) {
    if (selectedValues.has(value)) {
      selectedValues.delete(value);
    } else {
      selectedValues.add(value);
    }

    const filterValues = Array.from(selectedValues);
    statusColumn.setFilterValue(filterValues.length ? filterValues : undefined);
    table.setPageIndex(0);
  }

  function clearFilter() {
    statusColumn.setFilterValue(undefined);
    table.setPageIndex(0);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("border-dashed", selectedValues.size > 0 && "border-solid bg-muted text-foreground")}
        >
          <PlusCircle data-icon="inline-start" />
          State
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-50">
        <DropdownMenuGroup>
          {boardColumns.map((c) => {
            const isSelected = selectedValues.has(c.id);
            const stateMeta = stateConfig[c.id];
            const StateIcon = stateMeta?.icon;

            return (
              <DropdownMenuCheckboxItem
                key={c.id}
                checked={isSelected}
                onCheckedChange={() => updateFilter(c.id)}
                onSelect={(event) => event.preventDefault()}
              >
                <div className="flex items-center gap-2">
                  {StateIcon && <StateIcon className={`h-4 w-4 ${stateMeta.colorClass}`} />}
                  <span>{c.title}</span>
                </div>
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={clearFilter} className="justify-center text-center">
                <X />
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
