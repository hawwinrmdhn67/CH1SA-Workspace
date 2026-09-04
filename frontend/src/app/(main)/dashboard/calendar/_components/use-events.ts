import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";

import { createEvent, deleteEvent, getEvents, updateEvent as updateEventApi } from "@/lib/api/calendar";

export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  groupId?: string;
  display?: string;
  description?: string;
  calendarId?: string;
  readOnly?: boolean;
  source?: string;
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const apiEvents = await getEvents();
      setEvents(
        apiEvents.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description || "",
          start: new Date(e.date + (e.start_time ? `T${e.start_time}` : "")),
          end: e.end_time ? new Date(e.date + `T${e.end_time}`) : undefined,
          allDay: e.all_day,
          calendarId: e.calendar,
        })),
      );
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    const handleUpdate = () => fetchEvents();
    window.addEventListener("workspace_updated", handleUpdate);
    return () => window.removeEventListener("workspace_updated", handleUpdate);
  }, [fetchEvents]);

  const addEvent = async (event: Omit<CalendarEvent, "id">) => {
    try {
      const startDate = event.start instanceof Date ? event.start : new Date(event.start);
      const endDate = event.end ? (event.end instanceof Date ? event.end : new Date(event.end)) : undefined;

      await createEvent({
        title: event.title,
        description: event.description,
        date: format(startDate, "yyyy-MM-dd"),
        start_time: format(startDate, "HH:mm:ss"),
        end_time: endDate ? format(endDate, "HH:mm:ss") : undefined,
        all_day: event.allDay || false,
        calendar: event.calendarId || "personal",
      });
      fetchEvents();
      window.dispatchEvent(new Event("workspace_updated"));
    } catch (err) {
      console.error("Failed to create event", err);
    }
  };

  const removeEvent = async (id: string) => {
    try {
      await deleteEvent(id);
      fetchEvents();
      window.dispatchEvent(new Event("workspace_updated"));
    } catch (err) {
      console.error("Failed to delete event", err);
    }
  };

  const updateEvent = async (id: string, event: Partial<CalendarEvent>) => {
    try {
      const updates: any = {};
      if (event.title !== undefined) updates.title = event.title;
      if (event.description !== undefined) updates.description = event.description;
      if (event.start !== undefined) {
        const start = event.start instanceof Date ? event.start : new Date(event.start);
        updates.date = format(start, "yyyy-MM-dd");
        updates.start_time = format(start, "HH:mm:ss");
      }
      if (event.end !== undefined) {
        const end = event.end instanceof Date ? event.end : new Date(event.end);
        updates.end_time = format(end, "HH:mm:ss");
      }
      if (event.allDay !== undefined) updates.all_day = event.allDay;
      if (event.calendarId !== undefined) updates.calendar = event.calendarId;

      await updateEventApi(id, updates);
      fetchEvents();
      window.dispatchEvent(new Event("workspace_updated"));
    } catch (err) {
      console.error("Failed to update event", err);
    }
  };

  return { events, isLoaded, addEvent, updateEvent, removeEvent, fetchEvents };
}
