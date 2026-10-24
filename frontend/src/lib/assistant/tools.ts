import { addTaskGlobally, deleteTaskGlobally, updateTaskGlobally } from "@/hooks/use-kanban-data";
import { createEvent, deleteEvent, getEvents, updateEvent } from "@/lib/api/calendar";
import { createNote, deleteNote, getNotes, updateNote } from "@/lib/api/notes";

import type { ActionType, ToolResult } from "./types";

const normalizePriority = (p: any) => {
  if (!p) return "None";
  const lower = String(p).toLowerCase();
  if (lower === "urgent") return "Urgent";
  if (lower === "high") return "High";
  if (lower === "medium") return "Medium";
  if (lower === "low") return "Low";
  return "None";
};

const normalizeStatus = (s: any) => {
  if (!s) return "backlog";
  const lower = String(s).toLowerCase();
  if (lower.includes("progress")) return "in-progress";
  if (lower.includes("todo") || lower.includes("to do")) return "todo";
  if (lower.includes("review")) return "in-progress"; 
  if (lower.includes("done") || lower.includes("complete")) return "done";
  if (lower.includes("cancel")) return "cancelled";
  return "backlog";
};

export const executeTool = async (type: ActionType, payload: any): Promise<ToolResult> => {
  try {
    switch (type) {
      case "create_task":
        addTaskGlobally({
          title: payload.title,
          description: payload.description,
          priority: normalizePriority(payload.priority),
          state: normalizeStatus(payload.status),
          dueDate: payload.dueDate,
        });
        return { success: true, message: "Task created successfully." };

      case "update_task":
        updateTaskGlobally(payload.id, {
          title: payload.title,
          priority: payload.priority ? normalizePriority(payload.priority) : undefined,
          state: payload.status ? normalizeStatus(payload.status) : undefined,
          dueDate: payload.dueDate,
        });
        return { success: true, message: "Task updated." };

      case "delete_task":
        deleteTaskGlobally(payload.id);
        return { success: true, message: "Task deleted." };

      case "search_tasks":
      case "get_task": {
        const saved = localStorage.getItem("kanban_board_state");
        if (!saved) return { success: true, message: "[]" };
        const board = JSON.parse(saved);
        const allTasks = Object.values(board).flat() as any[];
        const compact = allTasks
          .map((t) => ({ id: t.id, title: t.title, priority: t.priority, state: t.state, dueDate: t.dueDate }))
          .slice(0, 10);
        return { success: true, message: JSON.stringify(compact) };
      }

      case "create_event":
        await createEvent({
          title: payload.title,
          date: payload.date,
          all_day: payload.allDay !== false,
          calendar: payload.calendar || "personal",
        });
        window.dispatchEvent(new Event("workspace_updated"));
        return { success: true, message: "Event added." };

      case "update_event":
        await updateEvent(payload.id, {
          title: payload.title,
          date: payload.date,
        });
        window.dispatchEvent(new Event("workspace_updated"));
        return { success: true, message: "Event updated." };

      case "delete_event":
        await deleteEvent(payload.id);
        window.dispatchEvent(new Event("workspace_updated"));
        return { success: true, message: "Event deleted." };

      case "search_events":
      case "get_event": {
        const events = await getEvents();
        const compact = events
          .map((e) => ({ id: e.id, title: e.title, start: e.date, allDay: e.all_day }))
          .slice(0, 10);
        return { success: true, message: JSON.stringify(compact) };
      }

      case "create_note": {
        await createNote({
          title: payload.title || "Untitled Note",
          content: payload.content || "",
        });
        window.dispatchEvent(new Event("workspace_updated"));
        return { success: true, message: "Note created." };
      }

      case "update_note":
        await updateNote(payload.id, {
          title: payload.title,
          content: payload.content,
        });
        window.dispatchEvent(new Event("workspace_updated"));
        return { success: true, message: "Note updated." };

      case "delete_note":
        await deleteNote(payload.id);
        window.dispatchEvent(new Event("workspace_updated"));
        return { success: true, message: "Note deleted." };

      case "search_notes":
      case "get_note": {
        const notes = await getNotes();
        const compact = notes
          .map((n) => ({ id: n.id, title: n.title, content: n.content.substring(0, 300) }))
          .slice(0, 5);
        return { success: true, message: JSON.stringify(compact) };
      }

      default:
        return { success: false, message: "Unknown tool action." };
    }
  } catch (err: any) {
    console.error("Tool execution error:", err);
    return { success: false, message: `Failed to execute action: ${err.message}` };
  }
};
