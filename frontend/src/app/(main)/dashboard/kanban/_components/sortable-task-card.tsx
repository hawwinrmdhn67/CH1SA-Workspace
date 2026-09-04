"use client";

import * as React from "react";

import { useSortable } from "@dnd-kit/react/sortable";

import { cn } from "@/lib/utils";

import { KanbanTaskDetailModal } from "./kanban-task-detail-modal";
import { TaskCard } from "./task-card";
import type { ColumnId, Task } from "./types";

interface SortableTaskCardProps {
  task: Task;
  columnId: ColumnId;
  index: number;
  isList?: boolean;
  onUpdateTask?: (task: Partial<Task>) => void;
  onDeleteTask?: () => void;
  onDuplicateTask?: () => void;
}

export function SortableTaskCard({
  task,
  columnId,
  index,
  isList,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
}: SortableTaskCardProps) {
  const [showDetail, setShowDetail] = React.useState(false);
  const { isDragging, ref } = useSortable({
    id: task.id,
    index,
    type: "task",
    accept: "task",
    group: columnId,
    data: { type: "task", task, columnId },
  });

  return (
    <>
      <div ref={ref} className={cn("touch-none", isDragging && "opacity-30")}>
        <div
          role="button"
          tabIndex={0}
          className="w-full text-left outline-none cursor-grab active:cursor-grabbing"
          onClick={() => setShowDetail(true)}
        >
          <TaskCard
            task={task}
            columnId={columnId}
            isList={isList}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onDuplicateTask={onDuplicateTask}
          />
        </div>
      </div>
      <KanbanTaskDetailModal task={task} open={showDetail} onOpenChange={setShowDetail} onUpdateTask={onUpdateTask} />
    </>
  );
}
