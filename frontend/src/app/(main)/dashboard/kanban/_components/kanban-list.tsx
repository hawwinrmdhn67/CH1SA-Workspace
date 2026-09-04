"use client";
import * as React from "react";

import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/react";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { columns } from "./data";
import { KanbanTaskModal } from "./kanban-task-modal";
import { SortableTaskCard } from "./sortable-task-card";
import { stateConfig } from "./task-card";
import type { Column, ColumnId, Task } from "./types";

interface KanbanListProps {
  data: Task[];
  onAddTask?: (columnId: ColumnId, task: Partial<Task>) => void;
  onDeleteTask?: (id: string) => void;
  onDuplicateTask?: (task: Task) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
}

function ListColumn({
  column,
  columnTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
}: {
  column: Column;
  columnTasks: Task[];
  onAddTask?: (columnId: ColumnId, task: Partial<Task>) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDeleteTask?: (id: string) => void;
  onDuplicateTask?: (task: Task) => void;
}) {
  const taskDropTarget = useDroppable({
    id: column.id,
    type: "task-container",
    accept: "task",
    collisionPriority: CollisionPriority.Low,
    data: { type: "task-container", columnId: column.id },
  });

  const config = stateConfig[column.id];
  const StateIcon = config?.icon;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 px-4 lg:-mx-6 lg:px-6 py-3 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 flex items-center justify-between border-b">
        <div className="min-w-0 flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold",
              config ? config.colorClass : "text-foreground",
            )}
          >
            {StateIcon && <StateIcon className="size-4" />}
            <span className="truncate text-sm">{column.title}</span>
          </div>
          <span className="text-muted-foreground font-medium text-sm tabular-nums leading-none">
            {columnTasks.length}
          </span>
        </div>
        <KanbanTaskModal defaultState={column.id} onSave={(task) => onAddTask?.(column.id, task)}>
          <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
          </Button>
        </KanbanTaskModal>
      </div>

      <div
        ref={taskDropTarget.ref}
        className="flex min-h-[40px] flex-col gap-3 rounded-xl transition-colors data-[is-over=true]:bg-muted/30"
        data-is-over={taskDropTarget.isDropTarget}
      >
        {columnTasks.length === 0
          ? null
          : columnTasks.map((task, index) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                index={index}
                isList={true}
                onUpdateTask={(updates) => onUpdateTask?.(task.id, updates)}
                onDeleteTask={() => onDeleteTask?.(task.id)}
                onDuplicateTask={() => onDuplicateTask?.(task)}
              />
            ))}
      </div>
    </div>
  );
}

export function KanbanList({ data, onAddTask, onDeleteTask, onDuplicateTask, onUpdateTask }: KanbanListProps) {
  // Group tasks by state
  const tasksByState = React.useMemo(() => {
    const grouped: Record<ColumnId, Task[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = [];
    });
    data.forEach((task) => {
      if (task.state && grouped[task.state]) {
        grouped[task.state].push(task);
      }
    });
    return grouped;
  }, [data]);

  return (
    <div className="w-full flex flex-col">
      {columns.map((column) => {
        const columnTasks = tasksByState[column.id] || [];
        return (
          <ListColumn
            key={column.id}
            column={column}
            columnTasks={columnTasks}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onDuplicateTask={onDuplicateTask}
          />
        );
      })}
    </div>
  );
}
