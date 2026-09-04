"use client";

import * as React from "react";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { Subscribe } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  Calendar as CalendarIcon,
  CircleDashed,
  Flag,
  Hash,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Type,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { cn, getInitials } from "@/lib/utils";

import { columns as boardColumns } from "./data";
import { KanbanTaskDetailModal } from "./kanban-task-detail-modal";
import { KanbanTaskModal } from "./kanban-task-modal";
import { priorityBadgeConfig, stateConfig } from "./task-card";
import type { Task } from "./types";

function SortIcon({ sortDirection }: { sortDirection: false | "asc" | "desc" }) {
  if (sortDirection === "desc") {
    return <ArrowDown data-icon="inline-end" />;
  }

  if (sortDirection === "asc") {
    return <ArrowUp data-icon="inline-end" />;
  }

  return <ArrowUpDown data-icon="inline-end" />;
}

function TitleColumnHeader({ column }: { column: Column<DataTableFeatures, Task, unknown> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="-ml-3 text-muted-foreground data-[state=open]:bg-accent">
          <Type className="mr-2 size-4" />
          Title
          <SortIcon sortDirection={column.getIsSorted()} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
          <ArrowUp />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
          <ArrowDown />
          Desc
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => column.clearSorting()}>
          <RotateCcw />
          Reset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function parseDate(dateString?: string) {
  if (!dateString || dateString === "-") return undefined;
  const parsed = new Date(`${dateString} ${new Date().getFullYear()}`);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

const DateCell = ({ row, table, field }: { row: any; table: any; field: "startDate" | "dueDate" }) => {
  const meta = table.options.meta as any;
  const dateStr = row.getValue(field) as string | undefined;
  const [open, setOpen] = React.useState(false);
  const date = parseDate(dateStr);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex min-w-[80px] items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent px-2 py-1 -ml-2 rounded-md transition-colors border-0 bg-transparent focus:outline-none">
          {dateStr || "-"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            const formatted = d ? format(d, "MMM d") : "";
            meta?.updateTask?.((row.original as Task).id, { [field]: formatted });
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

const TitleCell = ({ row }: { row: any }) => {
  const [showDetail, setShowDetail] = React.useState(false);
  const task = row.original as Task;
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="flex min-w-0 items-center gap-2 cursor-pointer hover:underline outline-none"
        onClick={() => setShowDetail(true)}
      >
        <span className="max-w-lg truncate font-medium text-sm">{row.getValue("title")}</span>
      </div>
      <KanbanTaskDetailModal task={task} open={showDetail} onOpenChange={setShowDetail} />
    </>
  );
};

const DataTableRowActions = ({ row, table }: { row: any; table: any }) => {
  const task = row.original as Task;
  const meta = table.options.meta as any;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground data-[state=open]:bg-muted">
            <MoreHorizontal />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <KanbanTaskModal
            task={task}
            onSave={(updates) => {
              meta?.updateTask?.(task.id, updates);
            }}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
          </KanbanTaskModal>
          <DropdownMenuItem
            onClick={() => {
              meta?.duplicateTask?.(task);
            }}
          >
            Make a copy
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              meta?.deleteTask?.(task.id);
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export const columns: ColumnDef<DataTableFeatures, Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Subscribe
        source={table.atoms.rowSelection}
        selector={() =>
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && "indeterminate")
        }
      >
        {(checked) => (
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-0.5"
          />
        )}
      </Subscribe>
    ),
    cell: ({ row }) => (
      <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
        {(checked) => (
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        )}
      </Subscribe>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: () => (
      <div className="flex items-center gap-2">
        <Hash className="size-4" />
        <span>Task</span>
      </div>
    ),
    cell: ({ row }) => <div className="w-20 font-mono text-muted-foreground text-sm">{row.getValue("id")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <TitleColumnHeader column={column} />,
    cell: ({ row }) => <TitleCell row={row} />,
  },
  {
    accessorKey: "state",
    header: () => (
      <div className="flex items-center gap-2">
        <CircleDashed className="size-4" />
        <span>State</span>
      </div>
    ),
    cell: ({ row, table }) => {
      const state = row.getValue("state") as string;
      const config = stateConfig[state];

      if (!config) {
        return null;
      }

      const Icon = config.icon;

      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center cursor-pointer hover:opacity-80 border-0 bg-transparent p-0 m-0 focus:outline-none">
              <Badge className={cn("gap-1.5 rounded-sm border font-medium", config.colorClass)} variant="outline">
                {Icon && <Icon className="size-4" />}
                {config.label}
              </Badge>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {boardColumns.map((c) => {
              const stateMeta = stateConfig[c.id];
              const SIcon = stateMeta?.icon;
              return (
                <DropdownMenuItem
                  key={c.id}
                  onSelect={() => meta?.updateTask?.((row.original as Task).id, { state: c.id })}
                >
                  <div className="flex items-center gap-2 text-sm">
                    {SIcon && <SIcon className={cn("size-4", stateMeta.colorClass)} />}
                    {c.title}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: () => (
      <div className="flex items-center gap-2">
        <Flag className="size-4" />
        <span>Priority</span>
      </div>
    ),
    cell: ({ row, table }) => {
      const priority = row.getValue("priority") as keyof typeof priorityBadgeConfig;
      const config = priorityBadgeConfig[priority];

      if (!config) {
        return null;
      }

      const Icon = config.icon;

      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80 border-0 bg-transparent p-0 m-0 focus:outline-none outline-none">
              {Icon && <Icon className={cn("size-4", config.className)} />}
              {priority}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.keys(priorityBadgeConfig) as Array<keyof typeof priorityBadgeConfig>).map((key) => {
              const PIcon = priorityBadgeConfig[key].icon;
              return (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => meta?.updateTask?.((row.original as Task).id, { priority: key })}
                >
                  <div className="flex items-center gap-2 text-sm">
                    {PIcon && <PIcon className={cn("size-4", priorityBadgeConfig[key].className)} />}
                    {key}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "owner",
    header: () => (
      <div className="flex items-center gap-2">
        <Users className="size-4" />
        <span>Assignees</span>
      </div>
    ),
    cell: ({ row }) => {
      const owner = row.getValue("owner") as Task["owner"];
      return (
        <div className="flex items-center gap-2">
          <Avatar className={cn("size-6 after:rounded-sm", owner.tone)}>
            <AvatarFallback className="rounded-sm text-xs">{getInitials(owner.name)}</AvatarFallback>
          </Avatar>
          <span className="text-foreground text-xs font-medium">{owner.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: () => (
      <div className="flex items-center gap-2">
        <CalendarIcon className="size-4" />
        <span>Start Date</span>
      </div>
    ),
    cell: ({ row, table }) => <DateCell row={row} table={table} field="startDate" />,
  },
  {
    accessorKey: "dueDate",
    header: () => (
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4" />
        <span>Due Date</span>
      </div>
    ),
    cell: ({ row, table }) => <DateCell row={row} table={table} field="dueDate" />,
  },
  {
    id: "actions",
    cell: ({ row, table }) => <DataTableRowActions row={row} table={table} />,
  },
];
