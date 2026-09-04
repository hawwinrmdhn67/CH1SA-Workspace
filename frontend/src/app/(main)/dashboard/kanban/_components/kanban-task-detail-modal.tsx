"use client";

import * as React from "react";

import {
  AlertCircle,
  Ban,
  CalendarDays,
  CheckCircle2,
  Circle,
  HelpCircle,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Timer,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn, getInitials } from "@/lib/utils";

import { tagTones } from "./data";
import type { Task, TaskPriority } from "./types";

interface KanbanTaskDetailModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask?: (updates: Partial<Task>) => void;
}

const priorityConfig: Record<TaskPriority, { icon: any; color: string }> = {
  Urgent: { icon: AlertCircle, color: "text-red-500 bg-red-500/10 border-transparent dark:text-red-400" },
  High: { icon: SignalHigh, color: "text-orange-500 bg-orange-500/10 border-transparent dark:text-orange-400" },
  Medium: { icon: SignalMedium, color: "text-amber-700 bg-amber-500/10 border-transparent dark:text-amber-300" },
  Low: { icon: SignalLow, color: "text-blue-500 bg-blue-500/10 border-transparent dark:text-blue-400" },
  None: { icon: SignalZero, color: "text-slate-500 bg-slate-500/10 border-transparent dark:text-slate-400" },
};

const stateConfig: Record<string, { icon: any; label: string; colorClass: string }> = {
  backlog: { icon: HelpCircle, label: "Backlog", colorClass: "text-slate-500 bg-slate-500/10 dark:text-slate-400" },
  todo: { icon: Circle, label: "Todo", colorClass: "text-blue-600 bg-blue-500/10 dark:text-blue-400" },
  "in-progress": {
    icon: Timer,
    label: "In Progress",
    colorClass: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
  },
  done: { icon: CheckCircle2, label: "Done", colorClass: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
  cancelled: { icon: Ban, label: "Canceled", colorClass: "text-slate-500 bg-slate-500/10 dark:text-slate-400" },
};

const parseDate = (dateStr: string) => {
  if (!dateStr) return undefined;
  const parsed = new Date(`${dateStr}, ${new Date().getFullYear()}`);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

const isDateToday = (dateStr: string | undefined) => {
  if (!dateStr) return false;
  const date = parseDate(dateStr);
  if (!date) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isDatePast = (dateStr: string | undefined) => {
  if (!dateStr) return false;
  const date = parseDate(dateStr);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
};

export function KanbanTaskDetailModal({ task, open, onOpenChange, onUpdateTask }: KanbanTaskDetailModalProps) {
  const pConfig = priorityConfig[task.priority as TaskPriority] || priorityConfig.None;
  const PriorityIcon = pConfig.icon;
  const StateIcon = task.state && stateConfig[task.state] ? stateConfig[task.state].icon : Circle;
  const stateLabel = task.state && stateConfig[task.state] ? stateConfig[task.state].label : "To Do";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("flex items-center gap-1 px-2 py-0.5 font-medium", pConfig.color)}>
              <PriorityIcon className="size-3.5" />
              {task.priority || "None"}
            </Badge>
          </div>
          <DialogTitle className="text-xl mt-3">{task.title}</DialogTitle>
          <DialogDescription className="mt-1">Task details and information</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
            <div className="bg-muted/30 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border border-border/50 max-h-40 overflow-y-auto scrollbar-thin [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
              {task.description || "No description provided."}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Assignees</h4>
              <div className="flex items-center gap-2">
                <Avatar className={cn("size-6 after:rounded-sm", task.owner.tone)}>
                  <AvatarFallback className="rounded-sm text-xs">{getInitials(task.owner.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{task.owner.name}</span>
              </div>
            </div>

            {task.startDate && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Start Date</h4>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  {task.startDate}
                </div>
              </div>
            )}

            {task.dueDate && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Due Date</h4>
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    task.state !== "done" && isDatePast(task.dueDate)
                      ? "text-red-500"
                      : task.state !== "done" && isDateToday(task.dueDate)
                        ? "text-orange-500"
                        : "text-foreground",
                  )}
                >
                  <CalendarDays
                    className={cn(
                      "size-4",
                      task.state !== "done" && isDatePast(task.dueDate)
                        ? "text-red-500"
                        : task.state !== "done" && isDateToday(task.dueDate)
                          ? "text-orange-500"
                          : "text-muted-foreground",
                    )}
                  />
                  {task.dueDate}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">State</h4>
              <div
                className={cn(
                  "flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 font-medium",
                  task.state && stateConfig[task.state] ? stateConfig[task.state].colorClass : "",
                )}
              >
                <StateIcon className="size-3.5" />
                <span className="text-xs">{stateLabel}</span>
              </div>
            </div>
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                Subtasks
                <Badge variant="secondary" className="font-normal text-xs">
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                </Badge>
              </h4>
              <div className="flex flex-col gap-2">
                {task.subtasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-md border border-border/40 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={st.completed}
                      onCheckedChange={(checked) => {
                        const newSubtasks = task.subtasks!.map((s) =>
                          s.id === st.id ? { ...s, completed: !!checked } : s,
                        );
                        const completedCount = newSubtasks.filter((s) => s.completed).length;
                        const totalCount = newSubtasks.length;
                        const newProgress =
                          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : task.progress;
                        onUpdateTask?.({ subtasks: newSubtasks, progress: newProgress });
                      }}
                    />
                    <span className={cn("text-sm font-medium", st.completed && "line-through text-muted-foreground")}>
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
