"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const MIN_SCALE = 1;
export const MAX_SCALE = 8;

export type MapView = {
  scale: number;
  /** Top-left of the visible window, in grid units. */
  x: number;
  y: number;
};

/**
 * Zoom and pan for the atlas.
 *
 * Implemented as a moving viewBox rather than a CSS transform: the map is
 * vector all the way down, so a smaller viewBox is genuinely more detail
 * rather than a magnified bitmap, and marks can be counter-scaled to hold a
 * constant size on screen while the geography spreads out underneath them.
 *
 * Gesture rules are chosen so a map inside a long scrolling page never traps
 * the reader:
 *   plain wheel     → page scrolls, untouched
 *   ⌘/ctrl + wheel  → zoom (this is what a trackpad pinch sends on macOS)
 *   drag            → pan, but only once zoomed in; at 1× there's nothing to pan
 *   two-finger pinch→ zoom
 *   one finger      → page scrolls at 1×, pans once zoomed (via touch-action)
 */
export function useMapZoom(cols: number, rows: number, home: MapView) {
  const ref = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<MapView>(home);

  const homeRef = useRef(home);
  useEffect(() => {
    homeRef.current = home;
  }, [home]);

  // Mirrors state for use inside the native listeners, which are attached
  // once and would otherwise close over a stale view forever.
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const clamp = useCallback(
    (next: MapView): MapView => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale));
      const w = cols / scale;
      const h = rows / scale;
      return {
        scale,
        x: Math.min(Math.max(next.x, 0), cols - w),
        y: Math.min(Math.max(next.y, 0), rows - h),
      };
    },
    [cols, rows],
  );

  /** Zoom about a fixed point, given in grid units, so it stays put. */
  const zoomAbout = useCallback(
    (factor: number, px: number, py: number) => {
      setView((prev) => {
        const scale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, prev.scale * factor),
        );
        const ratio = prev.scale / scale;
        return clamp({
          scale,
          x: px - (px - prev.x) * ratio,
          y: py - (py - prev.y) * ratio,
        });
      });
    },
    [clamp],
  );

  /** Client coordinates → grid units. */
  const toGrid = useCallback(
    (clientX: number, clientY: number) => {
      const svg = ref.current;
      const current = viewRef.current;
      if (!svg) return { px: 0, py: 0 };

      const box = svg.getBoundingClientRect();
      return {
        px:
          current.x +
          ((clientX - box.left) / box.width) * (cols / current.scale),
        py:
          current.y +
          ((clientY - box.top) / box.height) * (rows / current.scale),
      };
    },
    [cols, rows],
  );

  /** Step zoom from the buttons, anchored on the centre of the view. */
  const zoomByStep = useCallback(
    (factor: number) => {
      const current = viewRef.current;
      zoomAbout(
        factor,
        current.x + cols / current.scale / 2,
        current.y + rows / current.scale / 2,
      );
    },
    [zoomAbout, cols, rows],
  );

  /** Back to the fitted starting view, not to the whole globe. */
  const reset = useCallback(() => setView(homeRef.current), []);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDistance = 0;
    let panning = false;
    let dragged = false;
    let last = { x: 0, y: 0 };
    let down = { x: 0, y: 0 };

    const onWheel = (event: WheelEvent) => {
      // Only claim the gesture when it's explicitly a zoom. A bare wheel has
      // to keep scrolling the page or the map becomes a scroll trap.
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const { px, py } = toGrid(event.clientX, event.clientY);
      zoomAbout(Math.exp(-event.deltaY * 0.01), px, py);
    };

    const onPointerDown = (event: PointerEvent) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values());
        pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
        panning = false;
        return;
      }

      // Deliberately NOT capturing the pointer here. setPointerCapture
      // retargets the eventual click to the <svg>, so a plain click on a pin
      // would never reach it. Capture is taken lazily, only once a real drag
      // has started — see onPointerMove.
      dragged = false;
      panning = false;
      last = { x: event.clientX, y: event.clientY };
      down = { x: event.clientX, y: event.clientY };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values());
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDistance > 0) {
          const { px, py } = toGrid((a.x + b.x) / 2, (a.y + b.y) / 2);
          zoomAbout(distance / pinchDistance, px, py);
        }
        pinchDistance = distance;
        dragged = true;
        return;
      }

      // Panning only makes sense once there's something outside the frame,
      // and only after the pointer has clearly travelled — 4px of slop keeps
      // an ordinary click (which always jitters a pixel or two) a click.
      if (!panning) {
        if (viewRef.current.scale <= homeRef.current.scale) return;
        const travelled = Math.hypot(
          event.clientX - down.x,
          event.clientY - down.y,
        );
        if (travelled < 4) return;
        panning = true;
        dragged = true;
        svg.setPointerCapture(event.pointerId);
        last = { x: event.clientX, y: event.clientY };
      }

      const box = svg.getBoundingClientRect();
      const current = viewRef.current;
      const dx =
        ((event.clientX - last.x) / box.width) * (cols / current.scale);
      const dy =
        ((event.clientY - last.y) / box.height) * (rows / current.scale);

      last = { x: event.clientX, y: event.clientY };
      setView((prev) => clamp({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    };

    const endPointer = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchDistance = 0;
      panning = false;
    };

    // A drag that ends on a pin would otherwise also open it. Swallow the
    // click in the capture phase before it ever reaches the pin.
    const onClickCapture = (event: MouseEvent) => {
      if (!dragged) return;
      event.stopPropagation();
      event.preventDefault();
      dragged = false;
    };

    const onDoubleClick = (event: MouseEvent) => {
      event.preventDefault();
      const { px, py } = toGrid(event.clientX, event.clientY);
      zoomAbout(1.8, px, py);
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    svg.addEventListener("pointerdown", onPointerDown);
    svg.addEventListener("pointermove", onPointerMove);
    svg.addEventListener("pointerup", endPointer);
    svg.addEventListener("pointercancel", endPointer);
    svg.addEventListener("click", onClickCapture, true);
    svg.addEventListener("dblclick", onDoubleClick);

    return () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("pointerdown", onPointerDown);
      svg.removeEventListener("pointermove", onPointerMove);
      svg.removeEventListener("pointerup", endPointer);
      svg.removeEventListener("pointercancel", endPointer);
      svg.removeEventListener("click", onClickCapture, true);
      svg.removeEventListener("dblclick", onDoubleClick);
    };
  }, [clamp, toGrid, zoomAbout, cols, rows]);

  const viewBox = `${view.x} ${view.y} ${cols / view.scale} ${
    rows / view.scale
  }`;

  return { ref, view, viewBox, zoomByStep, reset };
}
