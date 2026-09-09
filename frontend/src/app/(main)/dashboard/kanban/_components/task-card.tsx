"use client";

import { format } from "date-fns";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Circle,
  FileText,
  HelpCircle,
  type LucideIcon,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Timer,
  Trash2,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, getInitials } from "@/lib/utils";

import { tagTones } from "./data";
import { KanbanTaskModal } from "./kanban-task-modal";
import type { ColumnId, Task, TaskInsightLabel, TaskPriority } from "./types";

const taskInsightIcons: Record<TaskInsightLabel, LucideIcon> = {
  Attachments: Paperclip,
  Comments: MessageSquare,
  Documents: FileText,
};

export const stateConfig: Record<string, { icon: LucideIcon; label: string; colorClass: string }> = {
  backlog: { icon: HelpCircle, label: "Backlog", colorClass: "text-slate-500 bg-slate-500/10 dark:text-slate-400" },
  todo: { icon: Circle, label: "Todo", colorClass: "text-blue-600 bg-blue-500/10 dark:text-blue-400" },
  "in-progress": {
    icon: Timer,
    label: "In Progress",
    colorClass: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
  },
  done: { icon: CheckCircle2, label: "Done", colorClass: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
  cancelled: { icon: Ban, label: "Canceled", colorClass: "text-red-600 bg-red-500/10 dark:text-red-400" },
};

export const priorityBadgeConfig: Record<
  TaskPriority,
  { icon: LucideIcon; variant: "destructive" | "secondary"; className: string; iconWrapperClass?: string }
> = {
  Urgent: {
    icon: AlertCircle,
    variant: "destructive",
    className: "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300",
    iconWrapperClass: "border border-red-500 dark:border-red-400 rounded p-[2px]",
  },
  High: {
    icon: SignalHigh,
    variant: "secondary",
    className: "text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300",
    iconWrapperClass: "border border-orange-500 dark:border-orange-400 rounded p-[2px]",
  },
  Medium: {
    icon: SignalMedium,
    variant: "secondary",
    className: "text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400",
    iconWrapperClass: "border border-yellow-600 dark:border-yellow-500 rounded p-[2px]",
  },
  Low: {
    icon: SignalLow,
    variant: "secondary",
    className: "text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300",
    iconWrapperClass: "border border-blue-500 dark:border-blue-400 rounded p-[2px]",
  },
  None: {
    icon: SignalZero,
    variant: "secondary",
    className: "text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300",
    iconWrapperClass: "border border-slate-500 dark:border-slate-400 rounded p-[2px]",
  },
};

const parseDate = (dateStr?: string) => {
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

export function TaskCard({
  task,
  columnId,
  isOverlay = false,
  isList = false,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
}: {
  task: Task;
  columnId?: ColumnId;
  isOverlay?: boolean;
  isList?: boolean;
  onUpdateTask?: (task: Partial<Task>) => void;
  onDeleteTask?: () => void;
  onDuplicateTask?: () => void;
}) {
  const isDone = columnId === "done";
  const owner = task.owner;
  const priorityConfig = priorityBadgeConfig[task.priority as TaskPriority] || priorityBadgeConfig.None;
  const PriorityIcon = priorityConfig.icon;
  const activeState = columnId || task.state;
  const StateIcon = activeState && stateConfig[activeState] ? stateConfig[activeState].icon : Circle;
  const stateLabel = activeState && stateConfig[activeState] ? stateConfig[activeState].label : "To Do";

  const hasBottomContent = (task.subtasks && task.subtasks.length > 0) || task.insights.length > 0;

  const renderProperties = () => (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
        <div className="flex shrink-0 items-center gap-1.5 mx-1">
          <Avatar className={cn("size-6 after:rounded-sm", owner.tone)}>
            <AvatarFallback className="rounded-sm text-xs">{getInitials(owner.name)}</AvatarFallback>
          </Avatar>
          <span className="text-foreground text-xs font-medium">{owner.name}</span>
        </div>

        <div className="group/date flex items-center gap-0.5">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none",
                      !task.startDate
                        ? "text-muted-foreground/50 border border-dashed border-muted/50 rounded-md px-1 py-0.5"
                        : "text-foreground",
                    )}
                  >
                    <CalendarDays className="size-3.5" />
                    <span className="truncate text-xs">{task.startDate || "Start"}</span>
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{task.startDate ? "Start Date" : "Add Start Date"}</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              className="w-auto p-0"
              align="start"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Calendar
                mode="single"
                selected={parseDate(task.startDate)}
                onSelect={(date) => {
                  if (date) {
                    const updates: Partial<Task> = { startDate: format(date, "MMM d") };
                    const parsedDueDate = parseDate(task.dueDate);
                    if (parsedDueDate && parsedDueDate < date) {
                      updates.dueDate = undefined;
                    }
                    onUpdateTask?.(updates);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          {task.startDate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateTask?.({ startDate: undefined });
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="hover:text-destructive transition-opacity focus:outline-none p-0.5 rounded-sm hover:bg-muted"
              aria-label="Clear start date"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="group/date flex items-center gap-0.5">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none",
                      !task.dueDate
                        ? "text-muted-foreground/50 border border-dashed border-muted/50 rounded-md px-1 py-0.5"
                        : task.state !== "done" && columnId !== "done" && isDatePast(task.dueDate)
                          ? "text-red-500"
                          : task.state !== "done" && columnId !== "done" && isDateToday(task.dueDate)
                            ? "text-orange-500"
                            : "text-foreground",
                    )}
                  >
                    <CalendarDays className="size-3.5" />
                    <span className="truncate text-xs">{task.dueDate || "Due"}</span>
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{task.dueDate ? "Due Date" : "Add Due Date"}</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              className="w-auto p-0"
              align="start"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Calendar
                mode="single"
                selected={parseDate(task.dueDate)}
                onSelect={(date) => {
                  if (date) onUpdateTask?.({ dueDate: format(date, "MMM d") });
                }}
                disabled={(date) => {
                  const startDate = parseDate(task.startDate);
                  return startDate ? date < startDate : false;
                }}
              />
            </PopoverContent>
          </Popover>
          {task.dueDate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateTask?.({ dueDate: undefined });
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="hover:text-destructive transition-opacity focus:outline-none p-0.5 rounded-sm hover:bg-muted"
              aria-label="Clear due date"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={cn(
                    "flex min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 font-medium cursor-pointer hover:opacity-80 transition-opacity focus:outline-none",
                    activeState && stateConfig[activeState] ? stateConfig[activeState].colorClass : "",
                  )}
                >
                  <StateIcon className="size-3.5" />
                  <span className="truncate text-xs">{stateLabel}</span>
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>State</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="start"
            className="p-1 min-w-[140px] scrollbar-thin [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {Object.entries(stateConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => onUpdateTask?.({ state: key as ColumnId })}
                  className="p-0 mb-1 last:mb-0 focus:bg-transparent"
                >
                  <div
                    className={cn(
                      "flex w-full items-center rounded-sm px-2 py-1.5 font-medium hover:opacity-80 transition-opacity",
                      config.colorClass,
                    )}
                  >
                    <Icon className="mr-2 size-3.5" />
                    {config.label}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );

  const renderActions = () => (
    <>
      <DropdownMenu>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border border-transparent px-2 py-0.5 text-xs font-semibold cursor-pointer hover:bg-muted transition-colors focus:outline-none",
                    priorityConfig.className,
                  )}
                >
                  <PriorityIcon className="size-3.5" />
                  {task.priority}
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Priority</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent
          align="start"
          className="p-1 min-w-[140px] scrollbar-thin [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {Object.entries(priorityBadgeConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <DropdownMenuItem
                key={key}
                onSelect={() => onUpdateTask?.({ priority: key as TaskPriority })}
                className={cn("p-0 mb-1 last:mb-0 focus:bg-muted cursor-pointer", config.className)}
              >
                <div className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 font-medium text-xs">
                  <Icon className="size-3.5" />
                  {key}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-muted-foreground hover:bg-muted"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {onUpdateTask && (
            <KanbanTaskModal task={task} onSave={onUpdateTask}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
            </KanbanTaskModal>
          )}
          {onDuplicateTask && <DropdownMenuItem onClick={onDuplicateTask}>Make a copy</DropdownMenuItem>}
          <DropdownMenuSeparator />
          {onDeleteTask && (
            <DropdownMenuItem onClick={onDeleteTask} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-background p-4 text-card-foreground shadow-xs",
        isOverlay && "w-[348px] rotate-1 shadow-lg",
      )}
    >
      {isList ? (
        <div className="flex items-center justify-between w-full">
          <h3 className="min-w-0 font-medium text-sm leading-snug truncate mr-4">{task.title}</h3>
          <div className="flex items-center gap-3 shrink-0">
            {renderProperties()}
            <div className="flex items-center gap-1 shrink-0">{renderActions()}</div>
          </div>
        </div>
      ) : (
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 font-medium text-sm leading-snug">{task.title}</h3>
            <div className="flex items-center gap-1 shrink-0">{renderActions()}</div>
          </div>
        </div>
      )}

      {!isList && renderProperties()}

      {hasBottomContent && (
        <>
          <Separator />
          <div>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              {task.subtasks && task.subtasks.length > 0 && (
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-sm",
                    task.subtasks.every((s) => s.completed) ? "text-emerald-500 font-medium" : "",
                  )}
                >
                  <CheckSquare className="size-3.5" />
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                </span>
              )}
              {task.insights.map((insight) => {
                const Icon = taskInsightIcons[insight.label];

                return (
                  <span key={insight.label} className="flex items-center gap-1.5 text-sm">
                    <Icon className="size-3.5" />
                    {insight.count}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}
    </article>
  );
}
