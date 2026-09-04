export type Role = "user" | "assistant";

export interface AssistantMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  pendingAction?: PendingAction;
}

export type ActionType =
  // Tasks
  | "create_task"
  | "update_task"
  | "delete_task"
  | "search_tasks"
  | "get_task"
  // Calendar
  | "create_event"
  | "update_event"
  | "delete_event"
  | "search_events"
  | "get_event"
  // Notes
  | "create_note"
  | "update_note"
  | "delete_note"
  | "search_notes"
  | "get_note"
  // File Manager
  | "create_folder"
  | "delete_folder"
  | "move_file"
  | "move_folder"
  | "rename_file"
  | "rename_folder"
  | "delete_file"
  | "star_file"
  | "unstar_file"
  | "star_folder"
  | "unstar_folder"
  | "search_files"
  | "search_folders"
  // Ambiguous/Search
  | "clarify"
  // Workspace Critical
  | "reset_workspace"
  | "bulk_update_tasks"
  | "bulk_delete_tasks";

export interface PendingAction {
  type: ActionType;
  payload: any;
  status: "pending" | "critical_pending" | "confirmed" | "cancelled" | "executed" | "error";
  previewText: string;
  confirmationId?: string;
  risk?: string;
  scope?: string;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
}
