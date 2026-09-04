"use client";

import { useEffect, useId, useRef } from "react";
import type { Entry } from "@/content/site";
import { RichText } from "@/components/rich-text";
import { SiteEmbed } from "@/components/site-embed";

/**
 * Full detail for one entry.
 *
 * Built on native <dialog>, which gives focus trapping, Escape-to-close,
 * background inerting, and scroll lock without any of it being reimplemented.
 * The only wiring needed is keeping React state in sync with the element's
 * own close event.
 */
export function EntryModal({
  entry,
  onClose,
}: {
  entry: Entry | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Entry ids are only unique within a section, so they can't safely become
  // DOM ids — two sections both have an entry 1. useId is unique per instance.
  const headingId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (entry && !dialog.open) dialog.showModal();
    if (!entry && dialog.open) dialog.close();
  }, [entry]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Fires for Escape and for close() alike, so state can't drift.
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  /**
   * Freeze the page behind the modal.
   *
   * showModal() makes the background inert to clicks and tab focus, but it
   * does NOT stop it scrolling — spin the wheel over the backdrop and the page
   * moves underneath. No layout shift when the scrollbar goes, because html
   * carries scrollbar-gutter: stable.
   */
  useEffect(() => {
    if (!entry) return;
    // Both elements: which one owns the viewport's scroll depends on the
    // document, and locking only html leaves body scrollable in some setups.
    const root = document.documentElement;
    const previousRoot = root.style.overflow;
    const previousBody = document.body.style.overflow;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousRoot;
      document.body.style.overflow = previousBody;
    };
  }, [entry]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={entry ? headingId : undefined}
      onClick={(event) => {
        // Clicks land on the dialog itself only when they hit the backdrop —
        // anything inside the panel is caught by the panel.
        if (event.target === ref.current) ref.current?.close();
      }}
      className="m-auto max-h-[calc(100dvh-48px)] w-[min(560px,calc(100vw-48px))] overflow-y-auto overscroll-contain rounded-md border border-ink/12 bg-paper p-0 text-ink shadow-[0_2px_6px_rgba(28,27,23,0.08),0_32px_64px_-32px_rgba(28,27,23,0.45)] backdrop:bg-ink/25 backdrop:backdrop-blur-[2px]"
    >
      {entry && (
        <div className="p-8">
          <div className="flex items-baseline justify-between gap-6">
            <div className="flex min-w-0 items-baseline gap-3">
              <h2
                id={headingId}
                className="font-display text-lead font-normal text-ink"
              >
                {entry.title}
              </h2>
              {entry.note && (
                <span className="meta truncate text-ink-faint">
                  {entry.note}
                </span>
              )}
            </div>
            {entry.meta && (
              <span className="meta shrink-0 text-ink-faint">
                {entry.meta}
              </span>
            )}
          </div>

          {entry.body && (
            <div className="mt-5 space-y-4">
              {entry.body.map((paragraph, index) => (
                <p key={index} className="text-pretty text-ink-muted">
                  <RichText text={paragraph} />
                </p>
              ))}
            </div>
          )}

          {entry.embed && (
            <div className="mt-6">
              <SiteEmbed src={entry.embed} title={entry.title} />
            </div>
          )}

          {entry.images && entry.images.length > 0 && (
            <div className="mt-6 space-y-3">
              {entry.images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt={entry.title}
                  className="block h-auto w-full rounded-sm border border-ink/10"
                />
              ))}
              {/* Not optional decoration — the CC licences on these require it. */}
              {entry.credit && (
                <p className="meta text-ink-faint">{entry.credit}</p>
              )}
            </div>
          )}

          {entry.links && entry.links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {entry.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="pill text-ink-muted underline underline-offset-4 hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="pill meta mt-8 text-ink-faint hover:text-ink"
          >
            close
          </button>
        </div>
      )}
    </dialog>
  );
}
