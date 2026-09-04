"use client";

import { useEffect, useState } from "react";

export const ACCENTS = ["blue", "violet", "green", "amber", "rose"] as const;
export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "blue";
const STORAGE_KEY = "accent";

/**
 * Runs before first paint, inlined in <head>. Without it the page renders in
 * the default accent and then snaps to the stored one — a visible flash on
 * every load for anyone who picked something else.
 *
 * Always writes the attribute, even for the default, so CSS can rely on it
 * being present.
 */
export const ACCENT_INIT_SCRIPT = `try{var a=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});document.documentElement.dataset.accent=a||${JSON.stringify(
  DEFAULT_ACCENT,
)}}catch(e){document.documentElement.dataset.accent=${JSON.stringify(
  DEFAULT_ACCENT,
)}}`;

/**
 * The root's data-accent attribute is the single source of truth: the head
 * script sets it pre-paint, CSS reads it for both the accent tokens and the
 * selected ring. React never renders the selection, so there's no server /
 * client mismatch to reconcile — state exists only to drive the write.
 */
export function AccentPicker() {
  const [choice, setChoice] = useState<Accent | null>(null);

  useEffect(() => {
    if (!choice) return;
    document.documentElement.dataset.accent = choice;
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Private mode. The choice still applies for this session.
    }
  }, [choice]);

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-center gap-[7px]">
      {ACCENTS.map((name) => (
        <button
          key={name}
          type="button"
          aria-label={`${name} accent`}
          title={name}
          onClick={() => setChoice(name)}
          // Sets the accent tokens on the swatch itself, so each one paints
          // in its own colour using the exact same gradient as the button.
          data-accent={name}
          className={`swatch swatch-${name}`}
        />
      ))}
    </div>
  );
}
