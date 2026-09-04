import { useFileManager } from "@/app/(main)/dashboard/file-manager/_components/use-file-manager";
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
  if (lower.includes("review")) return "in-progress"; // map review to in-progress since no review column
  if (lower.includes("done") || lower.includes("complete")) return "done";
  if (lower.includes("cancel")) return "cancelled";
  return "backlog";
};

export const executeTool = async (type: ActionType, payload: any): Promise<ToolResult> => {
  try {
    switch (type) {
      // --- TASKS ---
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

      // --- EVENTS ---
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

      // --- NOTES ---
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

      // --- FILE MANAGER ---
      case "create_folder": {
        const fm = useFileManager.getState();
        if (!fm.isInitialized) await fm.initialize();
        await fm.createFolder(payload.name, payload.parentId || null);
        return { success: true, message: "Folder created." };
      }

      case "delete_folder": {
        const fmd = useFileManager.getState();
        if (!fmd.isInitialized) await fmd.initialize();
        await fmd.deleteFolder(payload.id);
        return { success: true, message: "Folder deleted." };
      }

      case "move_file": {
        const fmm = useFileManager.getState();
        if (!fmm.isInitialized) await fmm.initialize();
        await fmm.moveFile(payload.id, payload.folderId || null);
        return { success: true, message: "File moved." };
      }

      case "move_folder":
        return { success: false, message: "Moving folders is not supported in the UI yet." };

      case "rename_file": {
        const fmrf = useFileManager.getState();
        if (!fmrf.isInitialized) await fmrf.initialize();
        await fmrf.renameFile(payload.id, payload.newName);
        return { success: true, message: "File renamed." };
      }

      case "rename_folder": {
        const fmrfo = useFileManager.getState();
        if (!fmrfo.isInitialized) await fmrfo.initialize();
        await fmrfo.renameFolder(payload.id, payload.newName);
        return { success: true, message: "Folder renamed." };
      }

      case "delete_file": {
        const fmdf = useFileManager.getState();
        if (!fmdf.isInitialized) await fmdf.initialize();
        await fmdf.deleteFile(payload.id);
        return { success: true, message: "File deleted." };
      }

      case "star_file":
      case "unstar_file": {
        const fmsf = useFileManager.getState();
        if (!fmsf.isInitialized) await fmsf.initialize();
        await fmsf.toggleStarFile(payload.id);
        return { success: true, message: "File star toggled." };
      }

      case "star_folder":
      case "unstar_folder": {
        const fmsof = useFileManager.getState();
        if (!fmsof.isInitialized) await fmsof.initialize();
        await fmsof.toggleStarFolder(payload.id);
        return { success: true, message: "Folder star toggled." };
      }

      case "search_files":
      case "search_folders": {
        const fms = useFileManager.getState();
        if (!fms.isInitialized) await fms.initialize();
        const files = fms.files.map((f) => ({ id: f.id, name: f.name, kind: f.kind, size: f.size })).slice(0, 10);
        const folders = fms.folders.map((f) => ({ id: f.id, name: f.name })).slice(0, 5);
        return { success: true, message: JSON.stringify({ files, folders }) };
      }

      default:
        return { success: false, message: "Unknown tool action." };
    }
  } catch (err: any) {
    console.error("Tool execution error:", err);
    return { success: false, message: `Failed to execute action: ${err.message}` };
  }
};
