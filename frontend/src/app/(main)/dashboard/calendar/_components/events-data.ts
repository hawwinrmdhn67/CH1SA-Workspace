import { setDate, setHours, setMinutes, startOfMonth } from "date-fns";

const monthStart = startOfMonth(new Date());
const currentYear = new Date().getFullYear();
const d = (day: number) => setDate(monthStart, day);
const dt = (day: number, hour: number, min = 0) => setMinutes(setHours(setDate(monthStart, day), hour), min);

export const demoEvents = [
  { id: "e1", title: "Monthly planning", start: dt(1, 9, 30), end: dt(1, 10, 30), calendarId: "work" },
  { id: "e2", title: "Design review", start: dt(3, 11), end: dt(3, 12), calendarId: "work" },
  { id: "e3", title: "Client check-in", start: dt(4, 15), end: dt(4, 15, 45), calendarId: "work" },
  { id: "e4", title: "Product workshop", start: d(7), end: d(9), allDay: true, calendarId: "team" },
  { id: "e5", groupId: "standup", title: "Team standup", start: dt(9, 10), calendarId: "team" },
  { id: "e6", title: "Finance sync", start: dt(10, 14, 30), end: dt(10, 15), calendarId: "work" },
  { id: "e7", title: "Focus block", start: dt(12, 9), end: dt(12, 12), display: "background", calendarId: "focus" },
  { id: "e8", title: "Sprint planning", start: dt(15, 9, 30), end: dt(15, 11), calendarId: "team" },
  { id: "e9", groupId: "standup", title: "Team standup", start: dt(16, 10), calendarId: "team" },
  { id: "e10", title: "Ops handoff", start: dt(18, 16), end: dt(18, 16, 45), calendarId: "work" },
  { id: "e11", title: "Quarterly report due", start: d(24), allDay: true, calendarId: "work" },
  { id: "e12", title: "Reset day", start: d(28), allDay: true, calendarId: "personal" },
  { id: "e13", title: "Arham Khan Birthday", start: new Date(currentYear, 8, 6), allDay: true, calendarId: "personal" },
];
