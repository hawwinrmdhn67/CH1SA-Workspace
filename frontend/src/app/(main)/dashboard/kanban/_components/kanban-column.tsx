"use client";

import * as React from "react";

import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { Circle, GripVertical, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { KanbanTaskModal } from "./kanban-task-modal";
import { SortableTaskCard } from "./sortable-task-card";
import { stateConfig } from "./task-card";
import type { Column, Task } from "./types";

interface KanbanColumnProps {
  column: Column;
  index: number;
  tasks: Task[];
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteColumn?: () => void;
  onRenameColumn?: (title: string) => void;
}

export function KanbanColumn({
  column,
  index,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  onDeleteColumn,
  onRenameColumn,
}: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");

  const columnSortable = useSortable({
    id: `column:${column.id}`,
    index,
    type: "column",
    accept: "column",
    group: "columns",
    data: { type: "column", columnId: column.id },
  });
  const taskDropTarget = useDroppable({
    id: column.id,
    type: "task-container",
    accept: "task",
    collisionPriority: CollisionPriority.Low,
    data: { type: "task-container", columnId: column.id },
  });

  return (
    <section
      ref={(node) => {
        if (typeof columnSortable.ref === "function") columnSortable.ref(node);
        else if (columnSortable.ref) (columnSortable.ref as React.MutableRefObject<any>).current = node;
        if (typeof taskDropTarget.ref === "function") taskDropTarget.ref(node);
        else if (taskDropTarget.ref) (taskDropTarget.ref as React.MutableRefObject<any>).current = node;
      }}
      className={cn(
        "flex max-h-full w-[380px] shrink-0 flex-col rounded-xl transition-colors",
        (columnSortable.isDropTarget || taskDropTarget.isDropTarget) && "bg-muted/30",
        columnSortable.isDragging && "opacity-60",
      )}
    >
      <div
        className="flex items-center justify-between px-3 pt-2 pb-2 cursor-grab active:cursor-grabbing"
        ref={columnSortable.handleRef}
      >
        <div className="min-w-0 flex items-center gap-2">
          {(() => {
            const config = stateConfig[column.id];
            const StateIcon = config ? config.icon : Circle;
            return (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold",
                  config ? config.colorClass : "text-foreground",
                )}
              >
                <StateIcon className="size-4" />
                <span className="truncate text-sm">{column.title}</span>
              </div>
            );
          })()}
          <span className="text-muted-foreground font-medium text-sm tabular-nums leading-none">{tasks.length}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <KanbanTaskModal onSave={onAddTask} defaultState={column.id}>
            <Button variant="ghost" size="icon-sm" aria-label={`Add task to ${column.title}`}>
              <Plus />
            </Button>
          </KanbanTaskModal>
        </div>
      </div>

      <div
        className={cn(
          "scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto px-3 [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1",
          tasks.length > 0 && "gap-3 pb-3",
        )}
      >
        {tasks.map((task, taskIndex) => (
          <SortableTaskCard
            key={task.id}
            task={task}
            columnId={column.id}
            index={taskIndex}
            onUpdateTask={(t) => onUpdateTask(task.id, t)}
            onDeleteTask={() => onDeleteTask(task.id)}
            onDuplicateTask={() => onDuplicateTask(task)}
          />
        ))}
      </div>

      <div className="px-3 pb-3 pt-2 shrink-0">
        {isAddingTask ? (
          <div className="flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
            <div className="flex flex-col gap-2 p-3 pb-3">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">{column.title}</span>
              <input
                autoFocus
                className="bg-transparent border-none outline-none text-sm font-medium placeholder:text-muted-foreground w-full"
                placeholder="Work item title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newTaskTitle.trim()) {
                      onAddTask({ title: newTaskTitle.trim() });
                      setNewTaskTitle("");
                    } else {
                      setIsAddingTask(false);
                    }
                  }
                  if (e.key === "Escape") {
                    setIsAddingTask(false);
                    setNewTaskTitle("");
                  }
                }}
                onBlur={() => {
                  if (newTaskTitle.trim()) {
                    onAddTask({ title: newTaskTitle.trim() });
                  }
                  setIsAddingTask(false);
                  setNewTaskTitle("");
                }}
              />
            </div>
            <div className="bg-muted/40 dark:bg-black/20 px-3 py-2 border-t border-border/50">
              <span className="text-[11px] italic text-muted-foreground opacity-80">
                Press 'Enter' to add another work item
              </span>
            </div>
          </div>
        ) : (
          <button
            className="flex w-full items-center justify-start text-muted-foreground opacity-60 hover:opacity-100 hover:text-foreground text-sm py-1.5 px-3 transition-colors"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Kanban
          </button>
        )}
      </div>
    </section>
  );
}
