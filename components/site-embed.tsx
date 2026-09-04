"use client";

import { useEffect, useRef, useState } from "react";

/** The viewport the site is rendered at before being scaled down. */
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 820;

/**
 * A live site, embedded.
 *
 * Two sizes. Inline it renders at a desktop viewport and is scaled to fit —
 * letting a 1280px design reflow into a 500px box would show its mobile
 * layout, which isn't the thing being shown off.
 *
 * Expanded it fills most of the window and drops the scaling entirely, so the
 * site lays itself out at a genuine desktop width and reads at full size.
 * That's a different thing from a magnified small frame: the page is really
 * being rendered that big, not blown up.
 *
 * Interactive at both sizes. The modal panel sets overscroll-behavior, so
 * reaching the end of a scroll inside the frame doesn't chain out and start
 * moving the page behind it.
 */
export function SiteEmbed({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const bigRef = useRef<HTMLDialogElement>(null);
  const [scale, setScale] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => setScale(node.clientWidth / FRAME_WIDTH);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Native <dialog> stacks in the top layer, so this sits above the entry
  // modal that contains it and Escape closes this one first — both for free.
  useEffect(() => {
    const dialog = bigRef.current;
    if (!dialog) return;
    if (expanded && !dialog.open) dialog.showModal();
    if (!expanded && dialog.open) dialog.close();
  }, [expanded]);

  useEffect(() => {
    const dialog = bigRef.current;
    if (!dialog) return;
    const sync = () => setExpanded(false);
    dialog.addEventListener("close", sync);
    return () => dialog.removeEventListener("close", sync);
  }, []);

  return (
    <>
      <div
        ref={ref}
        className="group relative w-full overflow-hidden rounded-sm border border-ink/10 bg-paper-deep"
        style={{ aspectRatio: `${FRAME_WIDTH} / ${FRAME_HEIGHT}` }}
      >
        {/* Held back until the scale is known — at scale 0 it would flash at
            full 1280px width for a frame before snapping down. */}
        {scale > 0 && (
          <iframe
            src={src}
            title={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
            className="absolute top-0 left-0 origin-top-left border-0"
            style={{
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
              transform: `scale(${scale})`,
            }}
          />
        )}

        {/* Sits above the frame, which is itself interactive. */}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={`open ${title} larger`}
          className="meta absolute top-2 right-2 z-10 rounded-sm border border-ink/12 bg-paper/85 px-2 py-1 text-ink-muted opacity-0 backdrop-blur-[2px] transition-all duration-150 group-hover:opacity-100 hover:text-ink focus-visible:opacity-100"
        >
          expand
        </button>
      </div>

      <dialog
        ref={bigRef}
        aria-label={title}
        onClick={(event) => {
          if (event.target === bigRef.current) bigRef.current?.close();
        }}
        className="m-auto h-[92dvh] w-[94vw] max-w-none overflow-hidden rounded-md border border-ink/12 bg-paper p-0 shadow-[0_2px_6px_rgba(28,27,23,0.08),0_40px_80px_-40px_rgba(28,27,23,0.5)] backdrop:bg-ink/35 backdrop:backdrop-blur-[3px]"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between gap-4 px-3 py-2">
            <span className="meta text-ink-faint">
              {src.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="pill meta text-ink-muted hover:text-ink"
            >
              close
            </button>
          </div>

          {/* No transform here. At this size the frame IS a desktop viewport,
              so the site lays itself out properly instead of being magnified. */}
          {expanded && (
            <iframe
              src={src}
              title={title}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="min-h-0 w-full flex-1 border-0"
            />
          )}
        </div>
      </dialog>
    </>
  );
}
