import { CalendarPanel } from "./_components/calendar-panel";
import { GlobalAddButton } from "./_components/global-add-button";
import { KanbanActivityChart } from "./_components/kanban-activity-chart";
import { KanbanActivitySummary } from "./_components/kanban-activity-summary";
import { RecentNotesCard } from "./_components/recent-notes-card";
import { SummaryCards } from "./_components/summary-cards";

export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Good morning, Hawwin.</h1>
          <p className="text-muted-foreground text-sm">Here's what needs your attention today.</p>
        </div>
        <GlobalAddButton />
      </div>

      {/* Main Content */}
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
