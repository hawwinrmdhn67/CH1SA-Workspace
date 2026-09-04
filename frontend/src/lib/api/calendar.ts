import { fetchApi } from "./client";

export interface CalendarEventDTO {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time?: string;
  end_time?: string;
  all_day: boolean;
  calendar: string;
  created_at: string;
  updated_at: string;
}

export async function getEvents(): Promise<CalendarEventDTO[]> {
  const response = await fetchApi("/calendar");
  return response.data;
}

export async function createEvent(event: Partial<CalendarEventDTO>): Promise<CalendarEventDTO> {
  const response = await fetchApi("/calendar", {
    method: "POST",
    body: JSON.stringify(event),
  });
  return response.data;
}

export async function updateEvent(id: string, updates: Partial<CalendarEventDTO>): Promise<CalendarEventDTO> {
  const response = await fetchApi(`/calendar/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return response.data;
}

export async function deleteEvent(id: string): Promise<void> {
  await fetchApi(`/calendar/${id}`, {
    method: "DELETE",
  });
}
