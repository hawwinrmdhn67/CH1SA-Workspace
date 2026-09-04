"use client";

import * as React from "react";

import { format } from "date-fns";
import { CalendarDays, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { stateConfig } from "./task-card";
import type { Subtask, Task, TaskPriority, ColumnId } from "./types";

const parseDate = (dateStr: string) => {
  if (!dateStr) return undefined;
  const parsed = new Date(`${dateStr}, ${new Date().getFullYear()}`);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

const isDateToday = (date: Date | undefined) => {
  if (!date || !(date instanceof Date)) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isDatePast = (date: Date | undefined) => {
  if (!date || !(date instanceof Date)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
};

interface KanbanTaskModalProps {
  task?: Task;
  defaultState?: string;
  onSave: (task: Partial<Task>) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KanbanTaskModal({ task, defaultState, onSave, children, open, onOpenChange }: KanbanTaskModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [title, setTitle] = React.useState(task?.title ?? "");
  const [description, setDescription] = React.useState(task?.description ?? "");
  const [state, setState] = React.useState<ColumnId>((task?.state as ColumnId) ?? (defaultState as ColumnId) ?? "backlog");
  const [priority, setPriority] = React.useState<TaskPriority>(task?.priority ?? "None");

  const [startDate, setStartDate] = React.useState<Date | undefined>(parseDate(task?.startDate ?? ""));
  const [dueDate, setDueDate] = React.useState<Date | undefined>(parseDate(task?.dueDate ?? ""));
  const [subtasks, setSubtasks] = React.useState<Subtask[]>(task?.subtasks ?? []);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setState((task?.state as ColumnId) ?? (defaultState as ColumnId) ?? "backlog");
      setPriority(task?.priority ?? "None");
      setStartDate(parseDate(task?.startDate ?? ""));
      setDueDate(parseDate(task?.dueDate ?? ""));
      setSubtasks(task?.subtasks ?? []);
      setNewSubtaskTitle("");
    }
  }, [isOpen, task, defaultState]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { id: `ST-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle("");
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      description,
      state,
      priority,
      startDate: startDate ? format(startDate, "MMM d") : undefined,
      dueDate: dueDate ? format(dueDate, "MMM d") : "",
      subtasks,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the details of your task." : "Create a new task for your Kanban board."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Update marketing materials"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the task..."
              className="resize-none h-20 overflow-y-auto scrollbar-thin [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1"
            />
          </div>
          <div className="grid gap-2">
            <Label>Subtasks</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <Button type="button" onClick={handleAddSubtask} variant="secondary" size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {subtasks.length > 0 && (
              <div className="mt-2 flex flex-col gap-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <Checkbox
                      checked={st.completed}
                      onCheckedChange={(checked) => {
                        setSubtasks((prev) => prev.map((s) => (s.id === st.id ? { ...s, completed: !!checked } : s)));
                      }}
                    />
                    <Input
                      value={st.title}
                      onChange={(e) => {
                        setSubtasks((prev) => prev.map((s) => (s.id === st.id ? { ...s, title: e.target.value } : s)));
                      }}
                      className={cn(
                        "h-8 border-transparent hover:border-border focus:border-border transition-colors",
                        st.completed && "line-through text-muted-foreground",
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setSubtasks((prev) => prev.filter((s) => s.id !== st.id));
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>State</Label>
              <Select value={state} onValueChange={(v) => setState(v as ColumnId)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stateConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem
                        key={key}
                        value={key}
                        className={cn(
                          "mb-1 last:mb-0 font-medium focus:opacity-80 focus:text-current",
                          config.colorClass,
                        )}
                      >
                        <div className="flex items-center">
                          <Icon className="mr-2 size-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2 flex-col">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date && dueDate && dueDate < date) {
                        setDueDate(undefined);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2 flex-col">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !dueDate
                        ? "text-muted-foreground"
                        : state !== "done" && isDatePast(dueDate)
                          ? "text-red-500"
                          : state !== "done" && isDateToday(dueDate)
                            ? "text-orange-500"
                            : "text-foreground",
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date) => (startDate ? date < startDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {task ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
