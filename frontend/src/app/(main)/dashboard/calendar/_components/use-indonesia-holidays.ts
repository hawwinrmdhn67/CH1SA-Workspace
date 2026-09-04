import { useEffect, useState } from "react";

import type { CalendarEvent } from "./use-events";

const API_BASE_URL = "https://date.nager.at/api/v3/PublicHolidays";

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
        const response = await fetch(`${API_BASE_URL}/${year}/ID`);
        if (!response.ok) {
          throw new Error(`Failed to fetch holidays: ${response.statusText}`);
        }

        const data = await response.json();

        const holidayEvents: CalendarEvent[] = data.map((h: any) => ({
          id: `holiday-ID-${h.date}`,
          title: h.localName || h.name,
          start: h.date,
          allDay: true,
          calendarId: "indonesia-holidays",
          source: "nager-date",
          readOnly: true,
        }));

        if (isMounted) {
          setHolidays((prev) => {
            // Merge while preventing duplicates
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
