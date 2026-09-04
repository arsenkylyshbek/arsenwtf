"use client";

import { useRef } from "react";
import { useSpec } from "./spec-context";
import { useElementSize } from "./use-element-size";

type SpecBoxProps = {
  /** What this element is, in token terms. e.g. `h1 · display/44 · Geist 600` */
  label: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Outlines one element and labels it with the tokens it was built from.
 * The dimensions are measured, not declared — if the box lies, spec mode
 * tells on it.
 */
export function SpecBox({ label, className, children }: SpecBoxProps) {
  const { enabled } = useSpec();
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref, enabled);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      {children}

      {enabled && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px z-20 rounded-xs border border-dashed border-spec-structure/45"
        >
          <span className="absolute -top-[7px] left-0 flex -translate-y-full items-center gap-[6px] rounded-xs whitespace-nowrap bg-spec-structure px-[5px] py-[2px] font-meta text-[10px] leading-[14px] font-normal tracking-[0.04em] text-paper">
            {label}
            {size && (
              <span className="text-paper/65">
                {size.width}×{size.height}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
