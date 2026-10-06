"use client";

import { useCallback, useState } from "react";
import type { Entry } from "@/content/site";
import { EntryModal } from "@/components/entry-modal";

/**
 * Photographs as plates.
 *
 * Deliberately not the site's list grammar and deliberately not a grid of
 * thumbnails. Every other section is an index because those things are
 * countable; this one isn't, and the break in pattern is what makes it read as
 * sincere rather than as another inventory.
 *
 * A plate is a photograph on a paper mat with its caption beneath — the way
 * pictures sit in a printed book, which is the metaphor the whole site is
 * already committed to.
 */
export function PhotoAlbum({ entries }: { entries: Entry[] }) {
  const [open, setOpen] = useState<Entry | null>(null);
  const closeModal = useCallback(() => setOpen(null), []);

  return (
    <>
      {/* CSS columns rather than a grid, and two of them rather than four.
          Two because photographs want to be looked at, and at thumbnail size
          nobody does. Columns because a grid forces every row to the height of
          its tallest plate — with portraits and landscapes mixed, which real
          photos always are, that leaves dead space under the shorter ones and
          knocks the captions out of line. The cost is column-major reading
          order, which an album doesn't care about; the alternative was
          cropping everything to a uniform ratio.

          Two at every width, including phones. Collapsing to one column there
          turns the album into a stack of full-bleed photos you scroll past one
          at a time, which reads as a feed; the whole point of an album is
          seeing several at once. The gutters tighten instead. */}
      <ul className="columns-2 gap-3 sm:gap-6">
        {entries.map((photo) => (
          <li key={photo.id} className="mb-4 break-inside-avoid sm:mb-8">
            <button
              type="button"
              onClick={() => setOpen(photo)}
              className="group block w-full cursor-pointer text-left"
            >
              {/* The mat: paper border around the print, so the photo sits ON
                  the page rather than being cut into it. */}
              <span className="block rounded-md border border-ink/10 bg-paper p-1 shadow-[0_1px_2px_rgba(28,27,23,0.06),0_10px_28px_-18px_rgba(28,27,23,0.4)] transition-shadow duration-200 group-hover:shadow-[0_1px_3px_rgba(28,27,23,0.08),0_16px_36px_-18px_rgba(28,27,23,0.5)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt={photo.title}
                  className="block h-auto w-full rounded-sm"
                />
              </span>

              <span className="mt-2 flex items-baseline justify-between gap-2 sm:gap-4">
                <span className="meta text-ink-muted transition-colors duration-150 group-hover:text-ink">
                  {photo.title}
                </span>
                {photo.meta && (
                  <span className="meta shrink-0 text-ink-faint">
                    {photo.meta}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <EntryModal entry={open} onClose={closeModal} />
    </>
  );
}
