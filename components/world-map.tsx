"use client";

import { useMemo } from "react";
import { hasDetail, type Entry } from "@/content/site";
import { DOT_GRID } from "@/content/dot-grid";
import {
  MAX_SCALE,
  MIN_SCALE,
  useMapZoom,
  type MapView,
} from "@/components/use-map-zoom";

/**
 * The atlas.
 *
 * Land is drawn as a dot grid rather than filled outlines — it sits on paper
 * like a halftone plate instead of a printed map, and it keeps the whole thing
 * in the ink ramp with no new colour.
 *
 * The 3,861 dots are one <path>, not 3,861 <circle> elements: each dot is a
 * zero-length subpath (`M x y h0`) rendered by a round linecap. One DOM node,
 * ~38KB of path data, and it stays crisp at any size because the viewBox is
 * in grid units.
 *
 * Hover and open state live in the parent, so the map and the country list
 * below it stay in sync.
 */
const DOT_PATH = DOT_GRID.dots
  .map(([col, row]) => `M${col} ${row}h0`)
  .join("");

/** Equirectangular, matching the generator's projection exactly. */
function project(lat: number, lon: number) {
  return {
    x: (lon - DOT_GRID.lonMin) / DOT_GRID.step,
    y: (DOT_GRID.latMax - lat) / DOT_GRID.step,
  };
}

/** Comfortable pointer target at 1×, in grid units (~26px on a 944px map). */
const BASE_HIT = 5;

export function WorldMap({
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
  const pinned = useMemo(
    () => entries.filter((entry) => entry.coords),
    [entries],
  );

  const points = useMemo(
    () => pinned.map((entry) => project(entry.coords![0], entry.coords![1])),
    [pinned],
  );

  // The whole world, always. Fitting the view to the pins cropped the empty
  // pacific but also meant the default frame moved every time a city was
  // added — the map should just be the map.
  const home = useMemo<MapView>(() => ({ scale: 1, x: 0, y: 0 }), []);

  const { ref, view, viewBox, zoomByStep, reset } = useMapZoom(
    DOT_GRID.cols,
    DOT_GRID.rows,
    home,
  );

  /**
   * Marks hold a constant size on screen while the geography spreads out
   * underneath them. Zooming a halftone grid by scaling its dots just makes
   * chunky dots; what you actually want is the same dots, further apart.
   */
  const k = view.scale;

  /**
   * Each pin gets the largest hit area that can't steal its neighbour's taps:
   * half the distance to the nearest other pin, or a comfortable target,
   * whichever is smaller.
   *
   * A fixed radius doesn't survive a real list. Boston and new york are 1.7
   * grid units apart, ho chi minh and nha trang 1.5 — a flat target would have
   * them almost entirely on top of each other, so whichever rendered last
   * would swallow every click meant for the other.
   *
   * Zooming is what actually resolves those pairs: the neighbour cap is fixed
   * in grid units, so once BASE_HIT/scale drops below it, targets stop being
   * constrained by the neighbour and start growing on screen.
   */
  const hitRadii = useMemo(() => {
    return points.map((point, index) => {
      let nearest = Infinity;
      for (let other = 0; other < points.length; other++) {
        if (other === index) continue;
        const distance = Math.hypot(
          point.x - points[other].x,
          point.y - points[other].y,
        );
        if (distance < nearest) nearest = distance;
      }
      return Math.max(0.4, Math.min(BASE_HIT / k, nearest / 2));
    });
  }, [points, k]);

  /** Hovered pin's position as a percentage of the current frame. */
  const labelled = useMemo(() => {
    const index = pinned.findIndex((entry) => entry.id === hovered);
    if (index === -1) return null;

    const point = points[index];
    const left = ((point.x - view.x) / (DOT_GRID.cols / view.scale)) * 100;
    const top = ((point.y - view.y) / (DOT_GRID.rows / view.scale)) * 100;

    return { title: pinned[index].title, left, top, flip: left > 72 };
  }, [hovered, pinned, points, view]);

  const zoomed = view.scale > home.scale + 0.001;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={viewBox}
        className={`h-auto w-full overflow-hidden ${
          zoomed ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        // At rest the map is a picture you scroll past; once zoomed it
        // becomes a surface you drag. Without this a one-finger drag would
        // trap the page on a phone.
        style={{ touchAction: zoomed ? "none" : "pan-y" }}
        role="img"
        aria-label="world map of places i've been"
      >
        {/* Land dots grow as k^0.35 — slower than the geography spreads,
            faster than holding a constant size. Counter-scaling them fully
            turns the continents into a sparse field of specks at 4×; not
            scaling them at all turns them into blobs. This exponent keeps
            the landmasses readable as shapes at every zoom level, since the
            2° data has no finer detail to reveal. */}
        <path
          d={DOT_PATH}
          fill="none"
          strokeWidth={0.55 / Math.pow(k, 0.35)}
          strokeLinecap="round"
          className="stroke-ink/22"
        />

        {pinned.map((entry, index) => {
          const { x, y } = project(entry.coords![0], entry.coords![1]);
          const active = hovered === entry.id;
          // A pin with nothing behind it still names itself on hover, but
          // isn't a control — same rule the lists follow.
          const openable = hasDetail(entry);

          return (
            <g
              key={entry.id}
              role={openable ? "button" : undefined}
              tabIndex={openable ? 0 : undefined}
              aria-label={entry.title}
              className={`focus:outline-none ${openable ? "cursor-pointer" : ""}`}
              onPointerEnter={() => onHover(entry.id)}
              onPointerLeave={() => onHover(hovered === entry.id ? null : hovered)}
              onFocus={() => onHover(entry.id)}
              onBlur={() => onHover(null)}
              onClick={openable ? () => onOpen(entry) : undefined}
              onKeyDown={
                openable
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpen(entry);
                      }
                    }
                  : undefined
              }
            >
              {/* Hit area — the visible pin is far too small to aim at.
                  Sized per pin; see hitRadii. */}
              <circle cx={x} cy={y} r={hitRadii[index]} fill="transparent" />
              {/* Accent fill with the darker accent edge around it — the
                  same two-tone treatment as the button, so a pin reads as
                  the same family of object. The edge also keeps the lighter
                  accents (amber, rose) legible against cream. */}
              <circle
                cx={x}
                cy={y}
                r={(active ? 1.35 : 0.85) / k}
                strokeWidth={0.25 / k}
                className="fill-[var(--accent-mid)] stroke-[var(--accent-edge)] transition-all duration-150"
              />
              <circle
                cx={x}
                cy={y}
                r={(active ? 3.2 : 2) / k}
                fill="none"
                strokeWidth={0.35 / k}
                className={`stroke-[var(--accent-mid)] transition-all duration-200 ${
                  active ? "opacity-45" : "opacity-0"
                }`}
              />
            </g>
          );
        })}
      </svg>

      {/* The city label is HTML, not SVG <text>.
          An SVG label has to be counter-scaled to hold its size, which means
          a font-size of ~0.5 user units at 6× — small enough that browsers
          round glyph advances and the letters collapse into each other
          ("ho chi minh" rendered as "hochmnh"). As HTML it's just 16px type
          in the site's own metadata style, at every zoom level. */}
      {labelled && (
        <div
          aria-hidden
          className="meta pointer-events-none absolute z-10 rounded-sm bg-paper/85 px-[5px] py-[1px] whitespace-nowrap text-ink backdrop-blur-[1px]"
          style={{
            left: `${labelled.left}%`,
            top: `${labelled.top}%`,
            // Flip to the other side near the right edge so the name never
            // runs out of the frame.
            transform: labelled.flip
              ? "translate(calc(-100% - 12px), -50%)"
              : "translate(12px, -50%)",
          }}
        >
          {labelled.title}
        </div>
      )}

      {/* Quiet paper backdrop so the controls read as chrome rather than as
          marks sitting in the middle of the map. */}
      <div className="absolute top-0 right-0 flex items-center gap-1 rounded-md bg-paper/75 backdrop-blur-[2px]">
        {zoomed && (
          <button
            type="button"
            onClick={reset}
            className="flex h-7 items-center rounded-md px-2 text-ink-muted transition-colors duration-150 hover:bg-ink/6 hover:text-ink"
          >
            reset
          </button>
        )}
        <button
          type="button"
          onClick={() => zoomByStep(1 / 1.6)}
          disabled={view.scale <= MIN_SCALE}
          aria-label="zoom out"
          className="flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-ink/6 hover:text-ink disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => zoomByStep(1.6)}
          disabled={view.scale >= MAX_SCALE}
          aria-label="zoom in"
          className="flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-ink/6 hover:text-ink disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
        >
          +
        </button>
      </div>

      {/* ⌘-scroll is undiscoverable, so it gets one quiet line — which goes
          away the moment it's no longer news. */}
      {!zoomed && (
        <p className="meta mt-2 text-ink-faint">⌘ scroll or pinch to zoom</p>
      )}
    </div>
  );
}
