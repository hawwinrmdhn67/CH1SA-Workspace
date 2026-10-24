"use client";

import { Activity, Archive, ArrowRight, CheckCircle2, Inbox, ListTodo } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKanbanTasks } from "@/hooks/use-kanban-data";

export function KanbanActivitySummary() {
  const { tasks, isLoaded } = useKanbanTasks();

  const backlogCount = tasks.filter((t) => t.state === "backlog" || !t.state).length;
  const todoCount = tasks.filter((t) => t.state === "todo").length;
  const inProgressCount = tasks.filter((t) => t.state === "in-progress").length;
  const doneCount = tasks.filter((t) => t.state === "done").length;
  const cancelledCount = tasks.filter((t) => t.state === "cancelled").length;

  const activityCards = [
    {
      title: "Backlog",
      value: isLoaded ? backlogCount.toString() : "-",
      description: "ideas & backlog",
      icon: Inbox,
      colorClass: "text-slate-500",
    },
    {
      title: "To Do",
      value: isLoaded ? todoCount.toString() : "-",
      description: "queued tasks",
      icon: ListTodo,
      colorClass: "text-sky-500",
    },
    {
      title: "In Progress",
      value: isLoaded ? inProgressCount.toString() : "-",
      description: "active tasks",
      icon: Activity,
      colorClass: "text-amber-500",
    },
    {
      title: "Done",
      value: isLoaded ? doneCount.toString() : "-",
      description: "completed tasks",
      icon: CheckCircle2,
      colorClass: "text-emerald-500",
    },
    {
      title: "Cancelled",
      value: isLoaded ? cancelledCount.toString() : "-",
      description: "archived tasks",
      icon: Archive,
      colorClass: "text-rose-500",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {activityCards.map((item) => (
          <Card key={item.title} className="shadow-xs">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <item.icon className={`size-4 shrink-0 ${item.colorClass}`} />
                  <span className="truncate">{item.title}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="text-2xl leading-none tracking-tight">{item.value}</div>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-muted-foreground tabular-nums leading-none text-xs truncate">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
