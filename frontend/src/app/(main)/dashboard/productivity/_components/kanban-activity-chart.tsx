"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useKanbanTasks } from "@/hooks/use-kanban-data";

const chartConfig = {
  count: {
    label: "Tasks",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function KanbanActivityChart() {
  const { tasks, isLoaded } = useKanbanTasks();

  const backlogCount = tasks.filter((t) => t.state === "backlog" || !t.state).length;
  const todoCount = tasks.filter((t) => t.state === "todo").length;
  const inProgressCount = tasks.filter((t) => t.state === "in-progress").length;
  const doneCount = tasks.filter((t) => t.state === "done").length;
  const cancelledCount = tasks.filter((t) => t.state === "cancelled").length;

  const chartData = [
    { status: "Backlog", count: backlogCount },
    { status: "To Do", count: todoCount },
    { status: "In Progress", count: inProgressCount },
    { status: "Done", count: doneCount },
    { status: "Cancelled", count: cancelledCount },
  ];

  if (!isLoaded) {
    return (
      <Card className="shadow-xs animate-pulse">
        <CardHeader>
          <CardTitle className="h-5 w-40 bg-muted rounded" />
          <CardDescription className="h-4 w-60 bg-muted/50 rounded mt-1" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full bg-muted/20 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Task Distribution</CardTitle>
        <CardDescription>Visual overview of all your tasks across different stages.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="status"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs text-muted-foreground"
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--muted)", strokeWidth: 2, strokeDasharray: "3 3" }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
