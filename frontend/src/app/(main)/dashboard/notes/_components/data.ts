import { subDays, subHours } from "date-fns";

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  color?: string;
  tags?: string[];
}

export const notesData: Note[] = [
  {
    id: "1",
    title: "Project Ideas 2026",
    content:
      "1. Build an AI-powered code assistant\n2. Integrate better project management tools\n3. Launch the new SaaS platform.",
    date: subHours(new Date(), 2).toISOString(),
  },
  {
    id: "2",
    title: "Meeting Notes - Weekly Sync",
    content:
      "Discussed Q3 goals.\n- Marketing needs more budget.\n- Engineering is on track.\n- Hiring: Need 2 more frontend devs.",
    date: subDays(new Date(), 1).toISOString(),
  },
  {
    id: "3",
    title: "Shopping List",
    content: "- Coffee beans\n- Almond milk\n- Avocados\n- Whole wheat bread",
    date: subDays(new Date(), 3).toISOString(),
  },
  {
    id: "4",
    title: "Book Recommendations",
    content: "1. Atomic Habits by James Clear\n2. The Pragmatic Programmer\n3. Clean Code",
    date: subDays(new Date(), 5).toISOString(),
  },
];
