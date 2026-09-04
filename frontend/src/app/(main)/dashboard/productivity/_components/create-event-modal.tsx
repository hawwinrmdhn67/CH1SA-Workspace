"use client";

import * as React from "react";

import { format, parse } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { toast } from "sonner";

import { type CalendarEvent, useEvents } from "@/app/(main)/dashboard/calendar/_components/use-events";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

const calendars = [
  { key: "work", label: "Work" },
  { key: "personal", label: "Personal" },
  { key: "team", label: "Team" },
  { key: "focus", label: "Focus time" },
];

export function CreateEventModal({
  children,
  open,
  onOpenChange,
  initialDate,
  eventToEdit,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialDate?: Date;
  eventToEdit?: CalendarEvent;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [calendarId, setCalendarId] = React.useState("work");

  const { addEvent, updateEvent } = useEvents();

  React.useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        const startDate = new Date(eventToEdit.start);
        setTitle(eventToEdit.title);
        setDate(startDate);
        setStartTime(format(startDate, "HH:mm"));
        if (eventToEdit.end) {
          const endDate = new Date(eventToEdit.end);
          setEndTime(format(endDate, "HH:mm"));
        } else {
          setEndTime(format(startDate, "HH:mm"));
        }
        setDescription(eventToEdit.description ?? "");
        setCalendarId(eventToEdit.calendarId ?? "work");
      } else {
        setTitle("");
        setDate(initialDate ?? undefined);
        setStartTime("");
        setEndTime("");
        setDescription("");
        setCalendarId("work");
      }
    }
  }, [isOpen, eventToEdit, initialDate]);

  const handleSave = () => {
    if (!title.trim() || !date || !startTime || !endTime) return;

    try {
      const parsedStart = parse(startTime, "HH:mm", date);
      const parsedEnd = parse(endTime, "HH:mm", date);

      if (parsedEnd < parsedStart) {
        toast.error("End time cannot be before start time");
        return;
      }

      if (eventToEdit && eventToEdit.id) {
        updateEvent(eventToEdit.id, {
          title: title.trim(),
          start: parsedStart,
          end: parsedEnd,
          description: description.trim(),
          calendarId,
        });
        toast.success("Event updated successfully");
      } else {
        addEvent({
          id: `EVT-${Date.now()}`,
          title: title.trim(),
          start: parsedStart,
          end: parsedEnd,
          description: description.trim(),
          calendarId,
        });
        toast.success("Event created successfully");
      }

      setIsOpen(false);
    } catch (e) {
      toast.error("Invalid time format. Use HH:mm");
    }
  };

  const isValid = title.trim() && date && startTime && endTime;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? "Edit Event" : "New Event"}</DialogTitle>
          <DialogDescription>
            {eventToEdit ? "Update your event details." : "Schedule a new event in your calendar."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Event Title</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Weekly Sync"
            />
          </div>
          <div className="grid gap-2">
            <Label>Calendar</Label>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a calendar" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 flex-col">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-time">Start Time</Label>
              <TimePicker id="start-time" value={startTime} onChange={setStartTime} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-time">End Time</Label>
              <TimePicker id="end-time" value={endTime} onChange={setEndTime} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-desc">Description (Optional)</Label>
            <Textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              className="resize-none h-20 overflow-y-auto scrollbar-thin [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {eventToEdit ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
