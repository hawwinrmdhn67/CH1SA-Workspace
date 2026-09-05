import * as React from "react";

import { formatDistanceToNow } from "date-fns";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useNotes } from "./use-notes";

interface NotesListProps {
  onSelectNote?: () => void;
}

export function NotesList({ onSelectNote }: NotesListProps) {
  const { noteState, setNoteState, notes, addNote } = useNotes();
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAddNote = async () => {
    await addNote({
      title: "New Note",
      content: "",
    });
    onSelectNote?.();
    setSearchQuery("");
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 p-4 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button onClick={handleAddNote} size="icon" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search notes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4 pt-0">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notes found</div>
          ) : (
            filteredNotes.map((item) => {
              const plainTextContent = item.content.replace(/<[^>]*>?/gm, "");

              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                    noteState.selected === item.id && "bg-muted",
                  )}
                  onClick={() => {
                    setNoteState({ ...noteState, selected: item.id });
                    onSelectNote?.();
                  }}
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{item.title}</div>
                      </div>
                      <div
                        className={cn(
                          "ml-auto text-xs",
                          noteState.selected === item.id ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {formatDistanceToNow(new Date(item.date), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">
                    {plainTextContent ? plainTextContent.substring(0, 300) : "No content"}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
