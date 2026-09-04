export type TaskStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "done"
  | "cancelled";

export type ColumnId = TaskStatus;

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Column = {
  id: ColumnId;
  title: string;
};

export type TaskTeam =
  | "Backend"
  | "Data"
  | "Design"
  | "Docs"
  | "Finance Ops"
  | "Platform"
  | "Product"
  | "QA"
  | "Security";

export type TaskPriority = "Urgent" | "High" | "Medium" | "Low" | "None";

export type TaskInsightLabel = "Attachments" | "Comments" | "Documents";

export type TaskInsight = {
  label: TaskInsightLabel;
  count: number;
};

export type TaskOwnerProfile = {
  name: string;
  tone: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  state?: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate: string;
  progress: number;
  owner: TaskOwnerProfile;
  team: TaskTeam;
  insights: TaskInsight[];
  subtasks?: Subtask[];
};

export type BoardState = Record<ColumnId, Task[]>;
