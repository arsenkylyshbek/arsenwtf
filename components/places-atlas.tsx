"use client";

import { useCallback, useState } from "react";
import type { Entry } from "@/content/site";
import { CountryList } from "@/components/country-list";
import { EntryModal } from "@/components/entry-modal";
import { HoverPreview, useCanHover } from "@/components/hover-preview";
import { WorldMap } from "@/components/world-map";

/**
 * The map and its index, sharing one hover and one modal.
 *
 * Keeping the state here is the whole point: running down the country list
 * lights the matching pin, and hovering a pin lights its row. Two views of
 * the same set rather than two separate lists that happen to agree.
 */
export function PlacesAtlas({ entries }: { entries: Entry[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState<Entry | null>(null);
  const canHover = useCanHover();
  const closeModal = useCallback(() => setOpen(null), []);

  const previewSrc =
    (canHover && entries.find((entry) => entry.id === hovered)?.preview) || null;

  return (
    <>
      <WorldMap
        entries={entries}
        hovered={hovered}
        onHover={setHovered}
        onOpen={setOpen}
      />

      <div className="mt-10">
        <CountryList
          entries={entries}
          hovered={hovered}
          onHover={setHovered}
          onOpen={setOpen}
        />
      </div>

      {canHover && <HoverPreview src={previewSrc} />}
      <EntryModal entry={open} onClose={closeModal} />
    </>
  );
}
