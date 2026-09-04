"use client";

import * as React from "react";

import { Plus } from "lucide-react";

import { KanbanTaskModal } from "@/app/(main)/dashboard/kanban/_components/kanban-task-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addTaskGlobally } from "@/hooks/use-kanban-data";

import { CreateEventModal } from "./create-event-modal";
import { CreateNoteModal } from "./create-note-modal";

export function GlobalAddButton() {
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [eventOpen, setEventOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg" className="w-full sm:w-auto h-12 px-6 text-base font-semibold shadow-lg">
            <Plus className="mr-2 h-5 w-5" strokeWidth={2.5} />
            Create New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem className="p-3 cursor-pointer text-base" onSelect={() => setTaskOpen(true)}>
            New Task
          </DropdownMenuItem>
          <DropdownMenuItem className="p-3 cursor-pointer text-base" onSelect={() => setNoteOpen(true)}>
            New Note
          </DropdownMenuItem>
          <DropdownMenuItem className="p-3 cursor-pointer text-base" onSelect={() => setEventOpen(true)}>
            New Event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <KanbanTaskModal
        defaultState="todo"
        onSave={(task) => addTaskGlobally(task)}
        open={taskOpen}
        onOpenChange={setTaskOpen}
      />
      <CreateNoteModal open={noteOpen} onOpenChange={setNoteOpen} />
      <CreateEventModal open={eventOpen} onOpenChange={setEventOpen} />
    </>
  );
}
