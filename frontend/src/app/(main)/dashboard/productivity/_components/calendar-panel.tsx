"use client";

import * as React from "react";

import { isSameDay, startOfMonth, startOfToday } from "date-fns";
import { enGB } from "date-fns/locale";

import { useEvents } from "@/app/(main)/dashboard/calendar/_components/use-events";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

export function CalendarPanel() {
  const today = startOfToday();
  const [date, setDate] = React.useState<Date | undefined>(today);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => startOfMonth(today));
  const { events } = useEvents();

  const modifiers = {
    hasEvent: (date: Date) => events.some((event) => isSameDay(new Date(event.start), date)),
  };

  const modifiersClassNames = {
    hasEvent:
      "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
  };

  return (
    <Card className="w-full" size="sm">
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          fixedWeeks
          locale={enGB}
          className="w-full p-0 relative"
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
        />
      </CardContent>
    </Card>
  );
}
