"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";

import { initialBoard } from "@/app/(main)/dashboard/kanban/_components/data";
import type { BoardState, ColumnId, Task } from "@/app/(main)/dashboard/kanban/_components/types";
import {
  createTask as createTaskApi,
  deleteTask as deleteTaskApi,
  getTasks,
  updateTask as updateTaskApi,
} from "@/lib/api/tasks";

// Adapter: API (YYYY-MM-DD or ISO) -> Kanban UI ("MMM d")
const apiDateToKanbanDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return format(d, "MMM d");
  } catch {
    return "";
  }
};

// Adapter: Kanban UI ("MMM d") -> API ("YYYY-MM-DD")
const kanbanDateToApiDate = (dateStr?: string) => {
  if (!dateStr || dateStr.trim() === "") return undefined;
  try {
    const parsed = new Date(`${dateStr}, ${new Date().getFullYear()}`);
    if (isNaN(parsed.getTime())) return undefined;
    return format(parsed, "yyyy-MM-dd");
  } catch {
    return undefined;
  }
};

export function useKanbanTasks() {
  const [board, setBoard] = useState<BoardState>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const apiTasks = await getTasks();

      const newBoard: BoardState = {};
      for (const key of Object.keys(initialBoard) as ColumnId[]) {
        newBoard[key] = [...initialBoard[key]];
      }
      
      const formattedTasks: Task[] = [];

      for (const t of apiTasks) {
        const formattedTask: Task = {
          id: t.id,
          title: t.title,
          description: t.description,
          state: t.status as ColumnId,
          priority: t.priority as any,
          team: "Product", // Default fallback
          startDate: apiDateToKanbanDate(t.startDate),
          dueDate: apiDateToKanbanDate(t.dueDate),
          subtasks: t.subtasks?.map((st) => ({
            id: st.id,
            title: st.title,
            completed: st.isCompleted,
          })) || [],
          progress: 0,
          owner: { name: "You", tone: "indigo" },
          insights: [],
        };

        const column = formattedTask.state || "backlog";
        if (!newBoard[column]) newBoard[column] = [];
        newBoard[column].push(formattedTask);
        formattedTasks.push(formattedTask);
      }

      setBoard(newBoard);
      setTasks(formattedTasks);
    } catch (e) {
      console.error("Failed to fetch kanban data", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const handleCustomEvent = () => refreshData();
    window.addEventListener("kanban_state_updated", handleCustomEvent);
    window.addEventListener("workspace_updated", handleCustomEvent);
    return () => {
      window.removeEventListener("kanban_state_updated", handleCustomEvent);
      window.removeEventListener("workspace_updated", handleCustomEvent);
    };
  }, [refreshData]);

  const updateTaskState = useCallback(
    (taskId: string, currentColumnId: string, newStateId: string) => {
      setBoard((prevBoard) => {
        const taskToMove = prevBoard[currentColumnId]?.find((t) => t.id === taskId);
        if (!taskToMove) return prevBoard;

        const newBoard = { ...prevBoard };
        newBoard[currentColumnId] = newBoard[currentColumnId].filter((t) => t.id !== taskId);

        const updatedTask = { ...taskToMove, state: newStateId as ColumnId };
        if (!newBoard[newStateId]) newBoard[newStateId] = [];
        newBoard[newStateId] = [updatedTask, ...newBoard[newStateId]];

        setTasks(Object.values(newBoard).flat());
        return newBoard;
      });

      // Background API call
      updateTaskApi(taskId, { status: newStateId }).catch((e) => {
        console.error("Failed to update task state", e);
        // Ideally rollback UI here
        refreshData();
      });
    },
    [refreshData],
  );

  return { board, setBoard, tasks, isLoaded, updateTaskState, refreshData };
}

export async function addTaskGlobally(partialTask: Partial<Task>) {
  try {
    const targetColumn = (partialTask.state as ColumnId) || "backlog";

    const apiTask: Partial<any> = {
      title: partialTask.title ?? "",
      description: partialTask.description ?? "",
      status: targetColumn,
      priority: partialTask.priority ?? "None",
    };

    const formattedDate = kanbanDateToApiDate(partialTask.dueDate);
    if (formattedDate) {
      apiTask.dueDate = formattedDate;
    }
    const formattedStartDate = kanbanDateToApiDate(partialTask.startDate);
    if (formattedStartDate) {
      apiTask.startDate = formattedStartDate;
    }

    if (partialTask.subtasks) {
      apiTask.subtasks = partialTask.subtasks.map((st, i) => {
        const payload: any = {
          title: st.title,
          isCompleted: st.completed,
          position: i,
        };
        if (st.id && !st.id.startsWith("ST-")) {
          payload.id = st.id;
        }
        return payload;
      });
    }

    await createTaskApi(apiTask);

    window.dispatchEvent(new Event("kanban_state_updated"));
  } catch (e) {
    console.error("Failed to add task globally", e);
  }
}

export async function updateTaskGlobally(taskId: string, updates: Partial<Task>) {
  try {
    const apiUpdates: any = {};
    if (updates.title !== undefined) apiUpdates.title = updates.title;
    if (updates.description !== undefined) apiUpdates.description = updates.description;
    if (updates.state !== undefined) apiUpdates.status = updates.state;
    if (updates.priority !== undefined) apiUpdates.priority = updates.priority;
    
    if (updates.dueDate !== undefined) {
      if (updates.dueDate === "") {
        apiUpdates.dueDate = null;
      } else {
        const formattedDate = kanbanDateToApiDate(updates.dueDate);
        if (formattedDate) {
          apiUpdates.dueDate = formattedDate;
        } else {
          apiUpdates.dueDate = null;
        }
      }
    }

    if (updates.startDate !== undefined) {
      if (updates.startDate === "") {
        apiUpdates.startDate = null;
      } else {
        const formattedDate = kanbanDateToApiDate(updates.startDate);
        if (formattedDate) {
          apiUpdates.startDate = formattedDate;
        } else {
          apiUpdates.startDate = null;
        }
      }
    }

    if (updates.subtasks !== undefined) {
      apiUpdates.subtasks = updates.subtasks.map((st, i) => {
        const payload: any = {
          title: st.title,
          isCompleted: st.completed,
          position: i,
        };
        if (st.id && !st.id.startsWith("ST-")) {
          payload.id = st.id;
        }
        return payload;
      });
    }

    await updateTaskApi(taskId, apiUpdates);
    window.dispatchEvent(new Event("kanban_state_updated"));
  } catch (e) {
    console.error("Failed to update task globally", e);
  }
}

export async function deleteTaskGlobally(taskId: string) {
  try {
    await deleteTaskApi(taskId);
    window.dispatchEvent(new Event("kanban_state_updated"));
  } catch (e) {
    console.error("Failed to delete task globally", e);
  }
}
