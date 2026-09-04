"use client";

import { useEffect, useRef, useState } from "react";
import { useSpec } from "./spec-context";

type Gap = { top: number; height: number };

/**
 * Measures the vertical gaps between its own direct children and draws them.
 *
 * This is the part that keeps the design honest: the numbers come from
 * getBoundingClientRect on the rendered page, so a 27px gap shows up as 27
 * and you go fix it.
 */
export function SpecStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { enabled } = useSpec();
  const ref = useRef<HTMLDivElement>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);

  useEffect(() => {
    const container = ref.current;
    if (!enabled || !container) {
      setGaps([]);
      return;
    }

    const measure = () => {
      const containerTop = container.getBoundingClientRect().top;
      const children = Array.from(container.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && !child.dataset.specOverlay,
      );

      const next: Gap[] = [];
      for (let i = 0; i < children.length - 1; i++) {
        const current = children[i].getBoundingClientRect();
        const following = children[i + 1].getBoundingClientRect();
        const height = following.top - current.bottom;
        if (height >= 2) {
          next.push({
            top: current.bottom - containerTop,
            height,
          });
        }
      }
      setGaps(next);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    for (const child of Array.from(container.children)) observer.observe(child);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [enabled, children]);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      {children}

      {enabled &&
        gaps.map((gap, index) => (
          <div
            key={index}
            aria-hidden
            data-spec-overlay="true"
            className="pointer-events-none absolute inset-x-0 z-10 flex items-center justify-end border-y border-dashed border-spec-measure/45 bg-spec-measure/8"
            style={{ top: gap.top, height: gap.height }}
          >
            {/* Right-aligned so it never collides with a SpecBox label,
                which always sits at the left. */}
            <span className="rounded-xs bg-spec-measure px-[5px] py-[2px] font-meta text-[10px] leading-[14px] font-normal tracking-[0.04em] text-paper">
              {Math.round(gap.height)}
            </span>
          </div>
        ))}
    </div>
  );
}
