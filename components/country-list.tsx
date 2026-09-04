"use client";

import { useMemo, useState } from "react";
import { hasDetail, type Entry } from "@/content/site";

/**
 * The atlas as an index.
 *
 * The map answers "where in the world"; this answers "where exactly, and how
 * many". It shares hover state with the map, so running down the list lights
 * up the corresponding pin — which is the only thing that stops it being a
 * redundant second copy of the same data.
 */
type CountryGroup = { country: string; cities: Entry[] };

/** Pinned to the top regardless of count. */
const FIRST = "united states";

function groupByCountry(entries: Entry[]): CountryGroup[] {
  const groups = new Map<string, Entry[]>();

  for (const entry of entries) {
    if (!entry.country) continue;
    const existing = groups.get(entry.country);
    if (existing) existing.push(entry);
    else groups.set(entry.country, [entry]);
  }

  return Array.from(groups, ([country, cities]) => ({ country, cities })).sort(
    (a, b) => {
      // Ordering is derived, not hand-maintained: adding a city can change
      // the order without anyone having to remember to re-sort the file.
      if (a.country === FIRST) return -1;
      if (b.country === FIRST) return 1;
      if (a.cities.length !== b.cities.length) {
        return b.cities.length - a.cities.length;
      }
      return a.country.localeCompare(b.country);
    },
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={`size-3 shrink-0 transition-transform duration-200 ${
        open ? "rotate-90" : ""
      }`}
    >
      <path
        d="M4.5 2.5 8 6l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CountryList({
  entries,
  hovered,
  onHover,
  onOpen,
}: {
  entries: Entry[];
  hovered: number | null;
  onHover: (id: number | null) => void;
  onOpen: (entry: Entry) => void;
}) {
  const groups = useMemo(() => groupByCountry(entries), [entries]);
  const [expanded, setExpanded] = useState<string[]>([FIRST]);

  const toggle = (country: string) =>
    setExpanded((current) =>
      current.includes(country)
        ? current.filter((name) => name !== country)
        : [...current, country],
    );

  return (
    <ul>
      {groups.map((group, index) => {
        const open = expanded.includes(group.country);

        return (
          <li
            key={group.country}
            className={index === groups.length - 1 ? "" : "border-b border-rule"}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggle(group.country)}
              className="flex h-14 w-full cursor-pointer items-center text-ink"
            >
              <span className="flex w-full items-baseline justify-between gap-6 text-left">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-ink-faint">
                    <Chevron open={open} />
                  </span>
                  {group.country}
                </span>
                <span className="meta shrink-0 text-ink-faint">
                  {group.cities.length}
                </span>
              </span>
            </button>

            {/* 0fr → 1fr animates to the content's natural height, which a
                fixed max-height can only approximate. */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <ul className="pb-3 pl-5">
                  {group.cities.map((city) => {
                    const openable = hasDetail(city);
                    const active = hovered === city.id;

                    const row = (
                      <span className="flex w-full items-baseline justify-between gap-6 text-left">
                        <span>{city.title}</span>
                        {city.meta && (
                          <span
                            className={`meta shrink-0 transition-colors duration-150 ${
                              active ? "text-ink-muted" : "text-ink-faint"
                            }`}
                          >
                            {city.meta}
                          </span>
                        )}
                      </span>
                    );

                    return (
                      <li
                        key={city.id}
                        onPointerEnter={() => onHover(city.id)}
                        onPointerLeave={() =>
                          onHover(hovered === city.id ? null : hovered)
                        }
                      >
                        {openable ? (
                          <button
                            type="button"
                            onClick={() => onOpen(city)}
                            onFocus={() => onHover(city.id)}
                            onBlur={() => onHover(null)}
                            className={`flex h-10 w-full cursor-pointer items-center transition-colors duration-150 ${
                              active ? "text-ink" : "text-ink-muted"
                            }`}
                          >
                            {row}
                          </button>
                        ) : (
                          <div
                            className={`flex h-10 w-full items-center transition-colors duration-150 ${
                              active ? "text-ink" : "text-ink-muted"
                            }`}
                          >
                            {row}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
