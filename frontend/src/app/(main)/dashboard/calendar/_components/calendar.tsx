"use client";

import * as React from "react";

import { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Plus, XIcon } from "lucide-react";

import { CreateEventModal } from "@/app/(main)/dashboard/productivity/_components/create-event-modal";
import { EventDetailsModal } from "@/app/(main)/dashboard/productivity/_components/event-details-modal";
import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { type CalendarEvent, useEvents } from "./use-events";
import { useIndonesiaHolidays } from "./use-indonesia-holidays";

const views = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "timeGridDay", label: "Day" },
];

const calendars = [
  { key: "all", label: "All calendars" },
  { key: "work", label: "Work" },
  { key: "personal", label: "Personal" },
  { key: "team", label: "Team" },
  { key: "focus", label: "Focus time" },
  { key: "indonesia-holidays", label: "Indonesia Holidays" },
];

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

export function Calendar() {
  const controller = useCalendarController();
  const [selectedCalendar, setSelectedCalendar] = React.useState(calendars[0].key);
  const [dateInfo, setDateInfo] = React.useState(() => {
    const now = new Date();

    return {
      title: format(now, "MMMM yyyy"),
      days: differenceInCalendarDays(endOfMonth(now), startOfMonth(now)) + 1,
      year: now.getFullYear(),
    };
  });

  const title = dateInfo.title;
  const days = dateInfo.days;
  const year = dateInfo.year;

  const [currentRange, setCurrentRange] = React.useState<{ start: Date; end: Date } | null>(null);

  const { events } = useEvents();
  const { holidays, isLoading } = useIndonesiaHolidays(year);

  const isMonthView = controller.view?.type === "dayGridMonth" || controller.view?.type === undefined;

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [clickedDate, setClickedDate] = React.useState<Date | undefined>(undefined);

  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false);
  const [clickedEvent, setClickedEvent] = React.useState<CalendarEvent | null>(null);

  const allEvents = React.useMemo(() => [...events, ...holidays], [events, holidays]);

  const filteredEvents = React.useMemo(() => {
    return selectedCalendar === "all" ? allEvents : allEvents.filter((e) => e.calendarId === selectedCalendar);
  }, [allEvents, selectedCalendar]);

  const eventCount = React.useMemo(() => {
    if (!currentRange) return 0;
    return filteredEvents.filter((event) => {
      let start: Date;
      if (typeof event.start === "string" && event.start.length === 10) {
        const [y, m, d] = event.start.split("-").map(Number);
        start = new Date(y, m - 1, d);
      } else {
        start = new Date(event.start);
      }
      return start >= currentRange.start && start < currentRange.end;
    }).length;
  }, [filteredEvents, currentRange]);

  return (
    <div
      className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col overflow-hidden p-4 md:p-6"
      data-content-padding="false"
    >
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="z-10 flex shrink-0 flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 shrink-0 flex-col gap-1">
            <div className="flex items-center gap-2 text-lg font-medium leading-none">
              {title}
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {days} days - {eventCount} events
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
              <SelectTrigger className="w-full sm:w-44">
                <CalendarIcon />
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.key} value={calendar.key}>
                      {calendar.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ButtonGroup>
              <Button size="icon" variant="outline" onClick={() => controller.prev()}>
                <ChevronLeft />
              </Button>
              <Button variant="outline" onClick={() => controller.today()}>
                Today
              </Button>
              <Button size="icon" variant="outline" onClick={() => controller.next()}>
                <ChevronRight />
              </Button>
            </ButtonGroup>
            <Select
              value={controller.view?.type ?? views[0].key}
              onValueChange={(value) => {
                controller.changeView(value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {views.map((v) => (
                    <SelectItem key={v.key} value={v.key}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setClickedDate(undefined);
                setCreateModalOpen(true);
              }}
            >
              <Plus />
              Add event
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "flex-1 min-h-0 bg-background",
            isMonthView
              ? "[&_.fc-scroller]:scrollbar-thin [&_.fc-scroller]:[scrollbar-color:var(--border)_transparent] [&_.fc-scroller::-webkit-scrollbar-thumb]:rounded-full [&_.fc-scroller::-webkit-scrollbar-thumb]:bg-border [&_.fc-scroller::-webkit-scrollbar-track]:bg-transparent [&_.fc-scroller::-webkit-scrollbar]:w-1.5"
              : "overflow-y-auto scrollbar-thin [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5",
          )}
        >
          <EventCalendarViews
            height={isMonthView ? "100%" : "auto"}
            controller={controller}
            initialView={views[0].key}
            plugins={[...plugins]}
            popoverCloseContent={() => <XIcon className="size-5 text-muted-foreground group-hover:text-foreground" />}
            events={filteredEvents}
            views={{ dayGrid: { eventDisplay: "block" } }}
            nowIndicator
            datesSet={(info) => {
              setDateInfo({
                title: info.view.title,
                days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
                year: info.view.currentStart.getFullYear(),
              });
              setCurrentRange({ start: info.start, end: info.end });
            }}
            dateClick={(info) => {
              setClickedDate(info.date);
              setCreateModalOpen(true);
            }}
            eventClick={(info) => {
              const rawEvent = allEvents.find((e) => e.id === info.event.id);
              if (rawEvent) {
                setClickedEvent(rawEvent);
                setDetailsModalOpen(true);
              }
            }}
          />
        </div>
      </div>

      <CreateEventModal open={createModalOpen} onOpenChange={setCreateModalOpen} initialDate={clickedDate} />
      <EventDetailsModal open={detailsModalOpen} onOpenChange={setDetailsModalOpen} event={clickedEvent} />
    </div>
  );
}
