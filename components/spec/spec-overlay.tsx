"use client";

import { useEffect, useState } from "react";
import { useSpec } from "./spec-context";

const BREAKPOINTS: [number, string][] = [
  [1536, "2xl"],
  [1280, "xl"],
  [1024, "lg"],
  [768, "md"],
  [640, "sm"],
];

function breakpointFor(width: number) {
  return BREAKPOINTS.find(([min]) => width >= min)?.[1] ?? "base";
}

function useViewport(active: boolean) {
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(
    null,
  );

  useEffect(() => {
    if (!active) return;
    const measure = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  return viewport;
}

/** One row of the readout panel. */
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="text-ink-faint">{k}</span>
      <span className="text-ink">{v}</span>
    </div>
  );
}

export function SpecOverlay() {
  const { enabled, toggle } = useSpec();
  const viewport = useViewport(enabled);

  return (
    <>
      {enabled && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
          {/* Baseline grid — the 8px unit everything is snapped to. Faint on
              purpose: it's a reference, not the subject. */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, color-mix(in srgb, var(--color-spec-structure) 9%, transparent) 0 1px, transparent 1px var(--layout-unit))",
            }}
          />

          {/* Layout guide — same .shell class as the page, so it can't drift.
              Rail and content each get edge lines; the rail gap between them
              is tinted, since that gap is the only thing separating them. */}
          <div className="shell h-full">
            <div className="relative h-full shrink-0 md:w-[var(--layout-rail)]">
              <div className="absolute inset-y-0 left-0 w-px bg-spec-structure/30" />
              <div className="absolute inset-y-0 right-0 w-px bg-spec-structure/30" />
            </div>
            <div className="relative h-full min-w-0 flex-1">
              <div className="absolute inset-y-0 left-0 w-px bg-spec-structure/30" />
              <div className="absolute inset-y-0 right-0 w-px bg-spec-structure/30" />
              <div
                className="absolute inset-y-0 bg-spec-measure/10"
                style={{
                  right: "100%",
                  width: "var(--layout-rail-gap)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Readout. Lives outside the overlay so it stays above the annotations. */}
      {enabled && (
        <aside className="fixed bottom-4 left-4 z-50 w-[228px] rounded-md border border-ink/12 bg-paper/92 p-3 font-meta text-[11px] leading-[18px] tracking-[0.01em] shadow-[0_1px_2px_rgba(28,27,23,0.06),0_8px_24px_-12px_rgba(28,27,23,0.25)] backdrop-blur-[2px]">
          <div className="mb-2 flex items-center gap-[6px] border-b border-ink/10 pb-2 text-[10px] tracking-[0.1em] text-ink-muted">
            <span className="size-[6px] rounded-xs bg-spec-structure" />
            spec
          </div>

          <div className="space-y-[2px]">
            <Row
              k="viewport"
              v={viewport ? `${viewport.w}×${viewport.h}` : "—"}
            />
            <Row k="breakpoint" v={viewport ? breakpointFor(viewport.w) : "—"} />
            <Row k="column" v="680px" />
            <Row k="gutter" v="24px" />
            <Row k="baseline" v="8px" />
            <Row k="radius" v="2 · 3 · 5" />
          </div>

          <div className="mt-2 space-y-[2px] border-t border-ink/10 pt-2">
            <Row k="display" v="Geist 44/48 · 400" />
            <Row k="lead" v="Inter 20/32" />
            <Row k="body" v="Inter 16/28" />
            <Row k="meta" v="Inter 16/28 · faint" />
          </div>

          <div className="mt-2 space-y-[2px] border-t border-ink/10 pt-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-faint">paper</span>
              <span className="flex items-center gap-[6px] text-ink">
                <span className="size-[10px] rounded-xs border border-ink/15 bg-paper" />
                #FBF9F3
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-faint">ink</span>
              <span className="flex items-center gap-[6px] text-ink">
                <span className="size-[10px] rounded-xs border border-ink/15 bg-ink" />
                #1C1B17
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* Toggle. Quiet when off; you only find it if you're looking. */}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        className={`fixed right-4 bottom-12 z-50 flex items-center gap-[6px] rounded-sm border px-[8px] py-[5px] font-meta text-[10px] leading-[14px] tracking-[0.08em] transition-colors duration-200 ${
          enabled
            ? "border-spec-structure bg-spec-structure text-paper"
            : "border-ink/12 bg-paper/70 text-ink-faint hover:border-ink/25 hover:text-ink-muted"
        }`}
      >
        <span
          className={`size-[6px] rounded-xs transition-colors duration-200 ${
            enabled ? "bg-paper" : "bg-ink-faint"
          }`}
        />
        spec
        <span className={enabled ? "text-paper/60" : "text-ink-faint/70"}>
          ⌥S
        </span>
      </button>
    </>
  );
}
