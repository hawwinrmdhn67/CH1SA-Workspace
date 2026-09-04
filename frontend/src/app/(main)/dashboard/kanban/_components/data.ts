import type { BoardState, Column, ColumnId, Task, TaskOwnerProfile, TaskPriority, TaskTeam } from "./types";

export const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
  { id: "cancelled", title: "Cancelled" },
] as const satisfies readonly Column[];

export const columnIds = columns.map((column) => column.id);

export const tagTones: Record<TaskTeam, string> = {
  Backend: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Data: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Design: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
  Docs: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  "Finance Ops": "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  Platform: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  Product: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  QA: "bg-red-500/10 text-red-700 dark:text-red-300",
  Security: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
};

const taskOwners = {
  arham: {
    name: "Arham Khan",
    tone: "[&_[data-slot=avatar-fallback]]:bg-zinc-100 [&_[data-slot=avatar-fallback]]:text-zinc-700 after:border-zinc-200 dark:[&_[data-slot=avatar-fallback]]:bg-zinc-500/15 dark:[&_[data-slot=avatar-fallback]]:text-zinc-300 dark:after:border-zinc-500/20",
  },
  junaid: {
    name: "Ethan Brooks",
    tone: "[&_[data-slot=avatar-fallback]]:bg-lime-100 [&_[data-slot=avatar-fallback]]:text-lime-700 after:border-lime-200 dark:[&_[data-slot=avatar-fallback]]:bg-lime-500/15 dark:[&_[data-slot=avatar-fallback]]:text-lime-300 dark:after:border-lime-500/20",
  },
  maya: {
    name: "Hannah Reed",
    tone: "[&_[data-slot=avatar-fallback]]:bg-indigo-100 [&_[data-slot=avatar-fallback]]:text-indigo-700 after:border-indigo-200 dark:[&_[data-slot=avatar-fallback]]:bg-indigo-500/15 dark:[&_[data-slot=avatar-fallback]]:text-indigo-300 dark:after:border-indigo-500/20",
  },
  meera: {
    name: "Rohan Iyer",
    tone: "[&_[data-slot=avatar-fallback]]:bg-fuchsia-100 [&_[data-slot=avatar-fallback]]:text-fuchsia-700 after:border-fuchsia-200 dark:[&_[data-slot=avatar-fallback]]:bg-fuchsia-500/15 dark:[&_[data-slot=avatar-fallback]]:text-fuchsia-300 dark:after:border-fuchsia-500/20",
  },
  nisha: {
    name: "Nora Bennett",
    tone: "[&_[data-slot=avatar-fallback]]:bg-violet-100 [&_[data-slot=avatar-fallback]]:text-violet-700 after:border-violet-200 dark:[&_[data-slot=avatar-fallback]]:bg-violet-500/15 dark:[&_[data-slot=avatar-fallback]]:text-violet-300 dark:after:border-violet-500/20",
  },
  rahul: {
    name: "Vikram Menon",
    tone: "[&_[data-slot=avatar-fallback]]:bg-pink-100 [&_[data-slot=avatar-fallback]]:text-pink-700 after:border-pink-200 dark:[&_[data-slot=avatar-fallback]]:bg-pink-500/15 dark:[&_[data-slot=avatar-fallback]]:text-pink-300 dark:after:border-pink-500/20",
  },
  sara: {
    name: "Clara Hughes",
    tone: "[&_[data-slot=avatar-fallback]]:bg-sky-100 [&_[data-slot=avatar-fallback]]:text-sky-700 after:border-sky-200 dark:[&_[data-slot=avatar-fallback]]:bg-sky-500/15 dark:[&_[data-slot=avatar-fallback]]:text-sky-300 dark:after:border-sky-500/20",
  },
} satisfies Record<string, TaskOwnerProfile>;

const teams: TaskTeam[] = ["Backend", "Data", "Design", "Docs", "Finance Ops", "Platform", "Product", "QA", "Security"];
const priorities: TaskPriority[] = ["Urgent", "High", "Medium", "Low", "None"];
const owners = Object.values(taskOwners);
const states: ColumnId[] = ["backlog", "todo", "in-progress", "done", "cancelled"];

export const initialBoard: BoardState = {
  backlog: [],
  todo: [],
  "in-progress": [],
  done: [],
  cancelled: [],
};
