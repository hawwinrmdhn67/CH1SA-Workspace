import { getValueFromCookie } from "@/server/server-actions";

import { notesData } from "./_components/data";
import { NotesComponent } from "./_components/notes";
import { DEFAULT_NOTES_LAYOUT, NOTES_LAYOUT_COOKIE } from "./_components/notes-layout-config";

export default async function Page() {
  const layoutCookie = await getValueFromCookie(NOTES_LAYOUT_COOKIE);

  return (
    <div className="h-[calc(100vh-theme(spacing.12))] md:h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] overflow-hidden rounded-xl border bg-background shadow-sm">
      <NotesComponent defaultLayout={layoutCookie ? JSON.parse(layoutCookie) : [...DEFAULT_NOTES_LAYOUT]} />
    </div>
  );
}
