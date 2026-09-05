"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";

import { createNote, deleteNote, getNotes, updateNote } from "@/lib/api/notes";

import type { Note } from "./data";

type UseNotesReturnType = {
  noteState: { selected: string | null };
  setNoteState: React.Dispatch<React.SetStateAction<{ selected: string | null }>>;
  notes: Note[];
  isLoaded: boolean;
  addNote: (note: Omit<Note, "id" | "date">) => Promise<string | null | undefined>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  fetchNotes: () => Promise<void>;
};

const NotesContext = createContext<UseNotesReturnType | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [noteState, setNoteState] = useState<{ selected: string | null }>({ selected: null });

  const fetchNotes = useCallback(async () => {
    try {
      const apiNotes = await getNotes();
      const formattedNotes = apiNotes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        date: n.updated_at,
        color: "blue",
        tags: [],
      }));
      setNotes(formattedNotes);

      setNoteState((prev) => {
        if (!prev.selected && formattedNotes.length > 0) {
          return { selected: formattedNotes[0].id };
        }
        return prev;
      });
    } catch (e) {
      console.error("Failed to fetch notes", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchNotes();

    const handleUpdate = () => fetchNotes();
    window.addEventListener("workspace_updated", handleUpdate);
    return () => window.removeEventListener("workspace_updated", handleUpdate);
  }, [fetchNotes]);

  const addNote = async (note: Omit<Note, "id" | "date">) => {
    try {
      const created = await createNote({
        title: note.title,
        content: note.content,
      });
      
      const newNote = {
        id: created.id,
        title: created.title,
        content: created.content,
        date: created.updated_at,
        color: "blue",
        tags: [],
      };
      
      setNotes((prev) => [newNote, ...prev]);
      setNoteState({ selected: created.id });
      
      fetchNotes();
      
      return created.id;
    } catch (e) {
      console.error("Failed to create note", e);
    }
  };

  const editNote = async (id: string, updates: Partial<Note>) => {
    try {
      await updateNote(id, {
        title: updates.title,
        content: updates.content,
      });
      fetchNotes();
    } catch (e) {
      console.error("Failed to update note", e);
    }
  };

  const removeNote = async (id: string) => {
    try {
      await deleteNote(id);
      fetchNotes();
    } catch (e) {
      console.error("Failed to delete note", e);
    }
  };

  const updateNoteAlias = async (id: string, updates: Partial<Note>) => {
    return editNote(id, updates);
  };

  const deleteNoteAlias = async (id: string) => {
    return removeNote(id);
  };

  return (
    <NotesContext.Provider
      value={{
        noteState,
        setNoteState,
        notes,
        isLoaded,
        addNote,
        deleteNote: deleteNoteAlias,
        updateNote: updateNoteAlias,
        fetchNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
