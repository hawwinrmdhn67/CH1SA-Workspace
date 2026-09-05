import * as React from "react";

import { format } from "date-fns";
import { Bold, Heading, Italic, Link, List, ListOrdered, Trash2, Underline } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { Note } from "./data";
import { useNotes } from "./use-notes";

interface NoteViewProps {
  note: Note | null;
  onClose?: () => void;
}

export function NoteView({ note, onClose }: NoteViewProps) {
  const { updateNote, deleteNote } = useNotes();
  const [localTitle, setLocalTitle] = React.useState("");
  const [localContent, setLocalContent] = React.useState("");
  const [saveStatus, setSaveStatus] = React.useState<"Saved" | "Saving..." | "Failed to save">("Saved");
  const [activeFormats, setActiveFormats] = React.useState({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });
  const [linkUrl, setLinkUrl] = React.useState("");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);

  const editorRef = React.useRef<HTMLDivElement>(null);
  const currentLoadedNoteId = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (note && note.id !== currentLoadedNoteId.current) {
      setLocalTitle(note.title);
      setLocalContent(note.content);
      setSaveStatus("Saved");
      currentLoadedNoteId.current = note.id;

      if (editorRef.current) {
        editorRef.current.innerHTML = note.content;
      }
    }
  }, [note?.id]);

  React.useEffect(() => {
    if (!note) return;

    if (localTitle === note.title && localContent === note.content) {
      return;
    }

    setSaveStatus("Saving...");
    const timeoutId = setTimeout(() => {
      try {
        updateNote(note.id, {
          title: localTitle,
          content: localContent,
          date: new Date().toISOString(),
        });
        setSaveStatus("Saved");
      } catch (error) {
        setSaveStatus("Failed to save");
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [localTitle, localContent, note, updateNote]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (note) {
          updateNote(note.id, {
            title: localTitle,
            content: localContent,
            date: new Date().toISOString(),
          });
          setSaveStatus("Saved");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [localTitle, localContent, note, updateNote]);

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
        No note selected
      </div>
    );
  }

  const handleDelete = () => {
    deleteNote(note.id);
    onClose?.();
  };

  const updateFormattingState = () => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  };

  const execCommand = (command: string, value?: string) => {
    if (document.activeElement !== editorRef.current) {
      editorRef.current?.focus();
    }

    document.execCommand(command, false, value);

    if (editorRef.current) {
      setLocalContent(editorRef.current.innerHTML);
    }
    updateFormattingState();
  };

  const insertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkUrl) {
      execCommand("createLink", linkUrl);
    }
    setLinkUrl("");
    setIsLinkDialogOpen(false);
  };

  const insertHeading = () => {
    execCommand("formatBlock", "H3");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex flex-col gap-1 w-full mr-4">
          <Input
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            className="font-semibold text-xl border-0 p-0 h-auto shadow-none focus-visible:ring-0 rounded-none w-full bg-transparent dark:bg-transparent"
            placeholder="Note Title"
          />
          <div className="flex items-center gap-2">
            <span className="line-clamp-1 text-xs text-muted-foreground">{format(new Date(note.date), "PPpp")}</span>
            <span
              className={cn(
                "text-xs italic transition-opacity",
                saveStatus === "Saved" ? "text-muted-foreground opacity-50" : "text-muted-foreground",
              )}
            >
              • {saveStatus}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {}
      <div
        className="flex items-center gap-1 px-4 py-2 border-y bg-muted/20 overflow-x-auto"
        onMouseDown={(e) => e.preventDefault()} 
      >
        <Button
          variant={activeFormats.bold ? "default" : "ghost"}
          size="icon"
          className={cn("h-8 w-8 transition-colors", !activeFormats.bold && "text-foreground/70")}
          onClick={() => execCommand("bold")}
        >
          <Bold className="h-4 w-4" strokeWidth={2.5} />
        </Button>
        <Button
          variant={activeFormats.italic ? "default" : "ghost"}
          size="icon"
          className={cn("h-8 w-8 transition-colors", !activeFormats.italic && "text-foreground/70")}
          onClick={() => execCommand("italic")}
        >
          <Italic className="h-4 w-4" strokeWidth={2.5} />
        </Button>
        <Button
          variant={activeFormats.underline ? "default" : "ghost"}
          size="icon"
          className={cn("h-8 w-8 transition-colors", !activeFormats.underline && "text-foreground/70")}
          onClick={() => execCommand("underline")}
        >
          <Underline className="h-4 w-4" strokeWidth={2.5} />
        </Button>
        <div className="w-[1px] h-4 bg-border mx-1" />
        <Button
          variant={activeFormats.insertUnorderedList ? "default" : "ghost"}
          size="icon"
          className={cn("h-8 w-8 transition-colors", !activeFormats.insertUnorderedList && "text-foreground/70")}
          onClick={() => execCommand("insertUnorderedList")}
        >
          <List className="h-4 w-4" strokeWidth={2.5} />
        </Button>
        <Button
          variant={activeFormats.insertOrderedList ? "default" : "ghost"}
          size="icon"
          className={cn("h-8 w-8 transition-colors", !activeFormats.insertOrderedList && "text-foreground/70")}
          onClick={() => execCommand("insertOrderedList")}
        >
          <ListOrdered className="h-4 w-4" strokeWidth={2.5} />
        </Button>
        <div className="w-[1px] h-4 bg-border mx-1" />
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 transition-colors text-foreground/70">
              <Link className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={insertLink} className="flex flex-col gap-4 py-4">
              <Input
                autoFocus
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Link</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 transition-colors text-foreground/70"
          onClick={insertHeading}
        >
          <Heading className="h-4 w-4" strokeWidth={2.5} />
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-hidden relative">
        {(!localContent || localContent === "<br>") && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none text-base">
            Start writing...
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          className="h-full w-full outline-none text-base leading-relaxed overflow-y-auto [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_a]:text-primary [&_a]:underline"
          onInput={(e) => {
            setLocalContent(e.currentTarget.innerHTML);
            updateFormattingState();
          }}
          onKeyUp={updateFormattingState}
          onMouseUp={updateFormattingState}
        />
      </div>
    </div>
  );
}
