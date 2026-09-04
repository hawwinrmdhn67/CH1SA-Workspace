"use client";

import { ArrowRight, Clock3, Focus, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKanbanTasks } from "@/hooks/use-kanban-data";

const isDateToday = (dateStr: string | undefined) => {
  if (!dateStr) return false;
  const parsed = new Date(`${dateStr}, ${new Date().getFullYear()}`);
  if (isNaN(parsed.getTime())) return false;
  const today = new Date();
  return (
    parsed.getDate() === today.getDate() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getFullYear() === today.getFullYear()
  );
};

export function SummaryCards() {
  const { tasks, isLoaded } = useKanbanTasks();

  const todayTasks = tasks.filter((t) => t.dueDate && isDateToday(t.dueDate)).length;

  const activeTasks = tasks.filter((t) => t.state !== "done" && t.state !== "backlog");
  const averageProgress =
    activeTasks.length > 0
      ? Math.round(activeTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / activeTasks.length)
      : 0;

  const focusTasks = tasks.filter(
    (t) => t.state !== "done" && (t.priority === "Urgent" || t.priority === "High"),
  ).length;

  const summaryCards = [
    {
      title: "Today",
      value: isLoaded ? todayTasks.toString() : "-",
      description: "tasks scheduled",
      icon: Clock3,
      colorClass: "text-primary",
      bgClass: "bg-primary/10 border-primary/20",
    },
    {
      title: "This Week",
      value: isLoaded ? `${averageProgress}%` : "-",
      description: "progress",
      icon: TrendingUp,
      colorClass: "text-primary",
      bgClass: "bg-primary/10 border-primary/20",
    },
    {
      title: "Focus",
      value: isLoaded ? focusTasks.toString() : "-",
      description: "high priority tasks",
      icon: Focus,
      colorClass: "text-primary",
      bgClass: "bg-primary/10 border-primary/20",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((item) => (
          <Card key={item.title} className="shadow-xs">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className={`grid size-7 place-items-center rounded-lg border ${item.bgClass}`}>
                    <item.icon className={`size-4 ${item.colorClass}`} />
                  </div>
                  {item.title}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="text-2xl leading-none tracking-tight">{item.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground tabular-nums leading-none">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
