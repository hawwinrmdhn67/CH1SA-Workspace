import { CalendarPanel } from "./_components/calendar-panel";
import { GlobalAddButton } from "./_components/global-add-button";
import { Greeting } from "./_components/greeting";
import { KanbanActivityChart } from "./_components/kanban-activity-chart";
import { KanbanActivitySummary } from "./_components/kanban-activity-summary";
import { RecentNotesCard } from "./_components/recent-notes-card";
import { SummaryCards } from "./_components/summary-cards";

export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      {}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Greeting />
          <p className="text-muted-foreground text-sm">Here's what needs your attention today.</p>
        </div>
        <GlobalAddButton />
      </div>

      {}
      <div className="grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          <SummaryCards />
          <KanbanActivitySummary />
          <KanbanActivityChart />
        </section>

        <section className="lg:col-span-4 xl:col-span-3 flex flex-col gap-8">
          <CalendarPanel />
          <RecentNotesCard />
        </section>
      </div>
    </div>
  );
}
