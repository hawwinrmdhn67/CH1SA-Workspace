"use client";

import * as React from "react";

import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useSidebar } from "@/components/ui/sidebar";
import { setClientCookie } from "@/lib/cookie.client";

import { NoteView } from "./note-view";
import {
  DEFAULT_NOTES_LAYOUT,
  NOTES_DETAIL_PANEL_ID,
  NOTES_LAYOUT_COOKIE,
  NOTES_LIST_PANEL_ID,
} from "./notes-layout-config";
import { NotesList } from "./notes-list";
import { useNotes } from "./use-notes";

interface NotesProps {
  defaultLayout: number[] | undefined;
}

export function NotesComponent({ defaultLayout = [...DEFAULT_NOTES_LAYOUT] }: NotesProps) {
  const { isMobile } = useSidebar();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex size-full items-center justify-center text-muted-foreground text-sm">Loading notes...</div>
    );
  }

  return isMobile ? <NotesMobileLayout /> : <NotesDesktopLayout defaultLayout={defaultLayout} />;
}

function NotesMobileLayout() {
  const { noteState, notes } = useNotes();
  const [isNoteOpen, setIsNoteOpen] = React.useState(false);
  const selectedNote = notes.find((item) => item.id === noteState.selected) || null;

  return (
    <>
      <NotesList onSelectNote={() => setIsNoteOpen(true)} />

      <Drawer open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DrawerContent>
          <DrawerTitle className="sr-only">Note details</DrawerTitle>
          <DrawerDescription className="sr-only">Read and edit the selected note</DrawerDescription>
          <div className="h-[80vh]">
            <NoteView note={selectedNote} onClose={() => setIsNoteOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function NotesDesktopLayout({ defaultLayout = [...DEFAULT_NOTES_LAYOUT] }: NotesProps) {
  const { noteState, notes } = useNotes();

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      onLayoutChanged={(layout) => {
        const sizes = [layout[NOTES_LIST_PANEL_ID], layout[NOTES_DETAIL_PANEL_ID]];
        setClientCookie(NOTES_LAYOUT_COOKIE, JSON.stringify(sizes));
      }}
      className="h-full items-stretch"
    >
      <ResizablePanel id={NOTES_LIST_PANEL_ID} defaultSize={defaultLayout[0]} minSize={30} className="min-h-0">
        <NotesList />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id={NOTES_DETAIL_PANEL_ID} defaultSize={defaultLayout[1]} minSize={30} className="min-h-0">
        <NoteView note={notes.find((item) => item.id === noteState.selected) || null} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
