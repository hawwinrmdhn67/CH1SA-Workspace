"use client";

import * as React from "react";

import { format } from "date-fns";
import { AlignLeft, Calendar as CalendarIcon, Clock, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { type CalendarEvent, useEvents } from "@/app/(main)/dashboard/calendar/_components/use-events";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CreateEventModal } from "./create-event-modal";

const calendars = {
  work: { label: "Work", color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
  personal: { label: "Personal", color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" },
  team: { label: "Team", color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
  focus: { label: "Focus time", color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" },
  "indonesia-holidays": { label: "Indonesia Holidays", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
};

export function EventDetailsModal({
  event,
  open,
  onOpenChange,
}: {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const { removeEvent } = useEvents();

  if (!event) return null;

  const handleEdit = () => {
    onOpenChange(false);
    setEditModalOpen(true);
  };

  const handleDelete = () => {
    if (event.id) {
      removeEvent(event.id);
      toast.success("Event deleted");
    }
    setDeleteAlertOpen(false);
    onOpenChange(false);
  };

  const calendarMeta = event.calendarId ? calendars[event.calendarId as keyof typeof calendars] : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex justify-between items-start pe-6">
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
            </div>
            <DialogDescription className="hidden">Event details</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-3 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(event.start), "EEEE, MMMM d, yyyy")}</span>
            </div>

            {!event.allDay && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(event.start), "h:mm a")}
                  {event.end ? ` - ${format(new Date(event.end), "h:mm a")}` : ""}
                </span>
              </div>
            )}

            {calendarMeta && (
              <div className="flex items-center gap-3 text-sm">
                <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center shrink-0" />
                <Badge variant="secondary" className={calendarMeta.color}>
                  {calendarMeta.label}
                </Badge>
              </div>
            )}

            {event.description && (
              <div className="flex gap-3 text-sm mt-2">
                <AlignLeft className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between">
            {!event.readOnly ? (
              <Button variant="destructive" size="sm" onClick={() => setDeleteAlertOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {!event.readOnly && (
                <Button size="sm" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateEventModal open={editModalOpen} onOpenChange={setEditModalOpen} eventToEdit={event} />
    </>
  );
}
