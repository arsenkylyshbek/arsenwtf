"use client";

import { useCallback, useState } from "react";
import { hasDetail, type Entry } from "@/content/site";
import { EntryModal } from "@/components/entry-modal";
import { HoverPreview, useCanHover } from "@/components/hover-preview";

/**
 * The site's one repeated component.
 *
 * A row is `title … meta`, hairline-ruled. Hover raises a preview beside the
 * cursor; click opens the full entry. Rows with nothing behind them render as
 * plain text rather than dead buttons — the list stays honest about what's
 * actually there.
 */
export function EntryList({ entries }: { entries: Entry[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState<Entry | null>(null);
  const canHover = useCanHover();

  const closeModal = useCallback(() => setOpen(null), []);

  const previewSrc =
    (canHover && entries.find((entry) => entry.id === hovered)?.preview) || null;

  return (
    <>
      <ul>
        {entries.map((entry, index) => {
          const interactive = hasDetail(entry);
          const last = index === entries.length - 1;

          const active = interactive && hovered === entry.id;

          /* Both in the metadata face, both one step off the ink — the note and the meta are
             the same kind of thing (facts about the entry), so they move
             together. The title stays sans: it's the thing itself. */
          const metaTone = active ? "text-ink-muted" : "text-ink-faint";

          const row = (
            <span className="flex w-full items-baseline justify-between gap-6 text-left">
              {/* Phones: the note goes under the title, so a long company
                  name and a job title never fight for one line. */}
              <span className="flex min-w-0 flex-col leading-snug sm:flex-row sm:items-baseline sm:gap-3 sm:leading-[inherit]">
                <span>{entry.title}</span>
                {entry.note && (
                  <span
                    className={`meta truncate transition-colors duration-150 ${metaTone}`}
                  >
                    {entry.note}
                  </span>
                )}
              </span>

              {entry.meta && (
                <span
                  className={`meta shrink-0 transition-colors duration-150 ${metaTone}`}
                >
                  {entry.meta}
                </span>
              )}
            </span>
          );

          return (
            <li
              key={entry.id}
              className={last ? "" : "border-b border-rule"}
              onPointerEnter={() => setHovered(entry.id)}
              onPointerLeave={() =>
                setHovered((current) => (current === entry.id ? null : current))
              }
            >
              {interactive ? (
                <button
                  type="button"
                  onClick={() => setOpen(entry)}
                  onFocus={() => setHovered(entry.id)}
                  onBlur={() => setHovered(null)}
                  className="flex min-h-14 w-full cursor-pointer items-center py-3 text-ink sm:h-14 sm:py-0"
                >
                  {row}
                </button>
              ) : (
                <div className="flex min-h-14 w-full items-center py-3 text-ink-muted sm:h-14 sm:py-0">
                  {row}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {canHover && <HoverPreview src={previewSrc} />}
      <EntryModal entry={open} onClose={closeModal} />
    </>
  );
}
