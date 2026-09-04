"use client";

import { useEffect, useState, type RefObject } from "react";

export type Size = { width: number; height: number };

/**
 * Live box size for an element, rounded to whole px.
 *
 * Re-measures on resize and on font load — web fonts swapping in is the most
 * common reason a measurement taken at mount goes stale.
 */
export function useElementSize(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): Size | null {
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref, active]);

  return size;
}
