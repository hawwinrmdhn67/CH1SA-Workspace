"use client";

import Link from "next/link";

import { format, isToday, isYesterday } from "date-fns";
import { FileText } from "lucide-react";

import { useNotes } from "@/app/(main)/dashboard/notes/_components/use-notes";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatNoteDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function RecentNotesCard() {
  const { notes } = useNotes();
  const recentNotes = notes.slice(0, 4);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Recent Notes</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <Link href="/dashboard/notes">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {recentNotes.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent notes.</div>
        ) : (
          recentNotes.map((note) => (
            <div key={note.id} className="flex items-start gap-4">
              <FileText className="size-5 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate font-medium text-sm leading-none">{note.title}</div>
                <div className="text-muted-foreground text-xs">{formatNoteDate(note.date)}</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
