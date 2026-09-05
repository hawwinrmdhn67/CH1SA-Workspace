import { useEffect, useState } from "react";

import type { CalendarEvent } from "./use-events";

const API_BASE_URL = "https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/calendar.json";

export function useIndonesiaHolidays(year: number) {
  const [holidays, setHolidays] = useState<CalendarEvent[]>([]);
  const [loadedYears, setLoadedYears] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!year || loadedYears.has(year)) {
      return;
    }

    let isMounted = true;

    async function fetchHolidays() {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch holidays: ${response.statusText}`);
        }

        const data = await response.json();
        const holidayEvents: CalendarEvent[] = [];

        for (const [dateString, info] of Object.entries(data)) {
          const h = info as any;
          if (h.holiday && dateString.startsWith(year.toString())) {
            holidayEvents.push({
              id: `holiday-ID-${dateString}`,
              title: h.summary ? h.summary.join(", ") : "Hari Libur Nasional",
              start: dateString,
              allDay: true,
              calendarId: "indonesia-holidays",
              source: "github-apiharilibur",
              readOnly: true,
            });
          }
        }

        if (isMounted) {
          setHolidays((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newHolidays = holidayEvents.filter((h) => !existingIds.has(h.id));
            return [...prev, ...newHolidays];
          });
          setLoadedYears((prev) => new Set(prev).add(year));
        }
      } catch (error) {
        console.error("Failed to fetch Indonesia holidays:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHolidays();

    return () => {
      isMounted = false;
    };
  }, [year, loadedYears]);

  return { holidays, isLoading };
}
