"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import {
  ArrowUpDown,
  Bot,
  ChevronDown,
  ChevronRight,
  Copy,
  Kanban as KanbanIcon,
  LayoutTemplate,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Table2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { columnIds, columns } from "./data";
import { KanbanColumn } from "./kanban-column";
import { KanbanList } from "./kanban-list";
import { KanbanTable } from "./kanban-table";
import { KanbanTaskModal } from "./kanban-task-modal";
import { priorityBadgeConfig, stateConfig, TaskCard } from "./task-card";
import type { BoardState, Column, ColumnId, Task, TaskPriority } from "./types";

import { useKanbanTasks, addTaskGlobally, updateTaskGlobally, deleteTaskGlobally } from "@/hooks/use-kanban-data";

interface KanbanProps {
  initialBoard: BoardState;
}

type TaskDragData = {
  type: "task";
  task: Task;
  columnId: ColumnId;
};

function isColumnId(value: unknown): value is ColumnId {
  return typeof value === "string" && (columnIds as readonly string[]).includes(value);
}

function isTaskDragData(value: unknown): value is TaskDragData {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "task" &&
    "task" in value &&
    typeof value.task === "object" &&
    value.task !== null &&
    "columnId" in value &&
    isColumnId(value.columnId)
  );
}

export function Kanban({ initialBoard }: KanbanProps) {
  const router = useRouter();
  const [view, setView] = React.useState<"board" | "table" | "list">("board");
  const { board, setBoard, isLoaded } = useKanbanTasks();

  const [boardColumns, setBoardColumns] = React.useState<Column[]>([...columns]);
  const [columnOrder, setColumnOrder] = React.useState<ColumnId[]>([...columnIds]);
  const [priorityFilters, setPriorityFilters] = React.useState<TaskPriority[]>([]);
  const [stateFilters, setStateFilters] = React.useState<ColumnId[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const boardBeforeDrag = React.useRef<BoardState>(initialBoard);
  const orderedColumns = columnOrder
    .flatMap((columnId) => boardColumns.find((column) => column.id === columnId) ?? [])
    .filter((column) => stateFilters.length === 0 || stateFilters.includes(column.id as ColumnId));

  const filteredBoard = React.useMemo(() => {
    const newBoard = { ...board };
    const query = searchQuery.toLowerCase();

    for (const key of Object.keys(newBoard) as ColumnId[]) {
      let columnTasks = [...newBoard[key]];

      if (query) {
        columnTasks = columnTasks.filter(
          (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query),
        );
      }

      if (priorityFilters.length > 0) {
        columnTasks = columnTasks.filter((t) => {
          return priorityFilters.includes(t.priority);
        });
      }

      newBoard[key] = columnTasks;
    }
    return newBoard;
  }, [board, priorityFilters, stateFilters, searchQuery]);

  const handleDeleteColumn = (columnId: ColumnId) => {
    setBoardColumns((prev) => prev.filter((c) => c.id !== columnId));
    setColumnOrder((prev) => prev.filter((id) => id !== columnId));
    toast.success("Column deleted");
  };

  const handleAddTask = (columnId: ColumnId, partialTask: Partial<Task>) => {
    const targetColumn = (partialTask.state as ColumnId) || columnId;
    const newTask: Task = {
      id: `TASK-${Math.floor(Math.random() * 10000)}`,
      title: partialTask.title ?? "",
      description: partialTask.description ?? "",
      state: targetColumn,
      priority: partialTask.priority ?? "None",
      team: partialTask.team ?? "Product",
      startDate: partialTask.startDate,
      dueDate: partialTask.dueDate ?? "",
      progress: 0,
      owner: { name: "You", tone: "indigo" },
      insights: [],
    };
    setBoard((prev) => ({
      ...prev,
      [targetColumn]: [newTask, ...(prev[targetColumn] || [])],
    }));
    addTaskGlobally(newTask);
    toast.success("Task created");
  };

  const handleUpdateTask = (columnId: ColumnId, taskId: string, updates: Partial<Task>) => {
    if (updates.state && updates.state !== columnId) {
      setBoard((prev) => {
        const taskToMove = prev[columnId]?.find((t) => t.id === taskId);
        if (!taskToMove) return prev;
        const updatedTask = { ...taskToMove, ...updates };
        return {
          ...prev,
          [columnId]: prev[columnId].filter((t) => t.id !== taskId),
          [updates.state as ColumnId]: [updatedTask, ...(prev[updates.state as ColumnId] || [])],
        };
      });
      updateTaskGlobally(taskId, updates);
      toast.success("Task updated and moved");
      return;
    }

    setBoard((prev) => ({
      ...prev,
      [columnId]: prev[columnId]?.map((t) => (t.id === taskId ? { ...t, ...updates } : t)) || [],
    }));
    updateTaskGlobally(taskId, updates);
    toast.success("Task updated");
  };

  const handleDeleteTask = (columnId: ColumnId, taskId: string) => {
    setBoard((prev) => ({
      ...prev,
      [columnId]: prev[columnId]?.filter((t) => t.id !== taskId) || [],
    }));
    deleteTaskGlobally(taskId);
    toast.error("Task deleted");
  };

  const handleDuplicateTask = (columnId: ColumnId, task: Task) => {
    const newTask = { ...task, id: `TASK-${Math.floor(Math.random() * 10000)}`, title: `${task.title} (Copy)` };
    setBoard((prev) => ({
      ...prev,
      [columnId]: [newTask, ...(prev[columnId] || [])],
    }));
    addTaskGlobally(newTask);
    toast.success("Task copied");
  };

  function handleDragStart(event: DragStartEvent) {
    const { source } = event.operation;

    if (source?.type === "task") {
      boardBeforeDrag.current = board;
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.operation.source?.type === "task") {
      setBoard((currentBoard) => move(currentBoard, event));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;

    if (!source) {
      return;
    }

    if (event.canceled) {
      if (source.type === "task") {
        setBoard(boardBeforeDrag.current);
      }
      return;
    }

    if (source.type === "column") {
      setColumnOrder((currentOrder) => move(currentOrder, event));
    } else if (source.type === "task") {
      let targetState: ColumnId | "" = "";
      setBoard((prev) => {
        const newBoard = { ...prev };
        for (const key of Object.keys(newBoard) as ColumnId[]) {
          newBoard[key] = newBoard[key].map((t: Task) => {
            if (t.id === source.data.task.id && t.state !== key) {
              targetState = key;
              return { ...t, state: key };
            } else if (t.state !== key) {
              return { ...t, state: key };
            }
            return t;
          });
        }
        return newBoard as BoardState;
      });

      if (targetState) {
         updateTaskGlobally(source.data.task.id, { state: targetState as ColumnId });
      }
    }
  }

  const totalTasks = Object.values(board).flat().length;

  const flatTasks = React.useMemo(() => {
    let allTasks = Object.values(board).flat();
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allTasks = allTasks.filter(
        (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query),
      );
    }
    if (priorityFilters.length > 0) {
      allTasks = allTasks.filter((t) => priorityFilters.includes(t.priority));
    }
    if (stateFilters.length > 0) {
      allTasks = allTasks.filter((t) => stateFilters.includes(t.state as ColumnId));
    }
    return allTasks;
  }, [board, priorityFilters, stateFilters, searchQuery]);

  return (
    <div className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 border-b px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={view}
            onValueChange={(v) => {
              if (v === "table" || v === "board" || v === "list") {
                setView(v as any);
              }
            }}
            aria-label="View mode"
          >
            <ToggleGroupItem value="board" aria-label="Board view">
              <KanbanIcon />
              Board
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List />
              List
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <Table2 />
              Table
            </ToggleGroupItem>
          </ToggleGroup>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <SlidersHorizontal data-icon="inline-start" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["Urgent", "High", "Medium", "Low", "None"] as TaskPriority[]).map((p) => {
                const PriorityIcon = priorityBadgeConfig[p].icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={p}
                    checked={priorityFilters.includes(p)}
                    onCheckedChange={(checked) => {
                      setPriorityFilters((prev) => (checked ? [...prev, p] : prev.filter((item) => item !== p)));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <PriorityIcon className={`h-4 w-4 ${priorityBadgeConfig[p].className}`} />
                      <span>{p}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by State</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((c) => {
                const stateMeta = stateConfig[c.id];
                const StateIcon = stateMeta?.icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={stateFilters.includes(c.id)}
                    onCheckedChange={(checked) => {
                      setStateFilters((prev) => (checked ? [...prev, c.id] : prev.filter((item) => item !== c.id)));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {StateIcon && <StateIcon className={`h-4 w-4 ${stateMeta.colorClass}`} />}
                      <span>{c.title}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center 2xl:justify-end">
          <div className="w-full sm:w-64">
            <InputGroup>
              <InputGroupAddon>
                <Search className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </div>

          <KanbanTaskModal defaultState="backlog" onSave={(task) => handleAddTask("backlog", task)}>
            <Button className="w-full sm:w-auto">
              <Plus data-icon="inline-start" />
              Add task
            </Button>
          </KanbanTaskModal>
        </div>
      </div>

      <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {view === "board" ? (
          <div className="scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden bg-muted/25 px-4 pt-4 pb-0 [scrollbar-color:var(--border)_transparent] lg:px-6 lg:pt-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
            <div className="flex h-full min-w-max items-start gap-4">
              {orderedColumns
                .filter((column) => stateFilters.length === 0 || stateFilters.includes(column.id))
                .map((column, index) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    index={index}
                    tasks={filteredBoard[column.id] || []}
                    onAddTask={(t) => handleAddTask(column.id, t)}
                    onUpdateTask={(id, t) => handleUpdateTask(column.id, id, t)}
                    onDeleteTask={(id) => handleDeleteTask(column.id, id)}
                    onDuplicateTask={(t) => handleDuplicateTask(column.id, t)}
                    onDeleteColumn={() => handleDeleteColumn(column.id)}
                  />
                ))}
            </div>
          </div>
        ) : view === "list" ? (
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-4 pt-0 [scrollbar-color:var(--border)_transparent] lg:px-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
            <KanbanList
              data={flatTasks}
              onAddTask={(columnId, task) => handleAddTask(columnId, task)}
              onUpdateTask={(taskId, updates) => {
                const taskToUpdate = flatTasks.find((t) => t.id === taskId);
                if (taskToUpdate) {
                  handleUpdateTask(taskToUpdate.state as ColumnId, taskId, updates);
                }
              }}
              onDeleteTask={(taskId) => {
                const taskToDelete = flatTasks.find((t) => t.id === taskId);
                if (taskToDelete) {
                  handleDeleteTask(taskToDelete.state as ColumnId, taskId);
                }
              }}
              onDuplicateTask={(task) => {
                handleDuplicateTask(task.state as ColumnId, task);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 px-4 py-4 lg:px-6">
            <KanbanTable
              data={flatTasks}
              onUpdateTask={(taskId, updates) => {
                const taskToUpdate = flatTasks.find((t) => t.id === taskId);
                if (taskToUpdate) {
                  handleUpdateTask(taskToUpdate.state as ColumnId, taskId, updates);
                }
              }}
              onDeleteTask={(taskId) => {
                const taskToDelete = flatTasks.find((t) => t.id === taskId);
                if (taskToDelete) {
                  handleDeleteTask(taskToDelete.state as ColumnId, taskId);
                }
              }}
              onDuplicateTask={(task) => {
                handleDuplicateTask(task.state as ColumnId, task);
              }}
            />
          </div>
        )}
        <DragOverlay dropAnimation={null}>
          {(source) => {
            if (source.type !== "task" || !isTaskDragData(source.data)) {
              return null;
            }

            const columnId = isSortable(source) && isColumnId(source.group) ? source.group : source.data.columnId;

            return <TaskCard task={source.data.task} columnId={columnId} isOverlay isList={view === "list"} />;
          }}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}
