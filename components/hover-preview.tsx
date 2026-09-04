"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor-following image preview.
 *
 * Desktop only, by capability rather than by screen width — a touch device
 * never fires a real hover, so the preview would just never appear. Anything
 * behind it has to be reachable another way (it is: the modal).
 *
 * Position is written straight to the transform in a rAF loop rather than
 * through React state, so pointer movement never triggers a re-render.
 */
export function useCanHover() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return canHover;
}

export function HoverPreview({ src }: { src: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);
  const seeded = useRef(false);

  useEffect(() => {
    /**
     * Horizontal is pinned to the right margin, not the cursor. A preview that
     * hangs off the pointer sits directly on top of the row you're reading —
     * it covers the very thing it's describing. Tracking only vertically keeps
     * the list legible and reads as composed rather than as a cursor toy.
     */
    const place = (node: HTMLElement) => {
      const width = node.offsetWidth || 240;
      const height = node.offsetHeight || 170;
      target.current = {
        x: window.innerWidth - width - 24,
        y: Math.min(
          Math.max(target.current.y, 24),
          window.innerHeight - height - 24,
        ),
      };
    };

    const onMove = (event: PointerEvent) => {
      target.current = { ...target.current, y: event.clientY - 80 };
      const node = ref.current;
      if (node) place(node);
      // First sample jumps into place; easing from 0,0 would fly across
      // the screen on the very first hover.
      if (!seeded.current) {
        current.current = { ...target.current };
        seeded.current = true;
      }
    };

    const tick = () => {
      const node = ref.current;
      if (node) {
        place(node);
        current.current.x += (target.current.x - current.current.x) * 0.2;
        current.current.y += (target.current.y - current.current.y) * 0.14;
        node.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      }
      frame.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-40 will-change-transform"
    >
      <div
        className={`origin-top-left transition-[opacity,scale] duration-200 ease-out ${
          src ? "scale-100 opacity-100" : "scale-98 opacity-0"
        }`}
      >
        {src && (
          /* Plate, not thumbnail: thin border, paper shadow, a degree of tilt
             so it sits on the page rather than floating above it. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="block h-auto w-[240px] -rotate-[1.5deg] rounded-md border border-ink/10 bg-paper p-1 shadow-[0_2px_4px_rgba(28,27,23,0.06),0_18px_40px_-20px_rgba(28,27,23,0.35)]"
          />
        )}
      </div>
    </div>
  );
}
