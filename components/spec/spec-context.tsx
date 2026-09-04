"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type SpecContextValue = {
  enabled: boolean;
  toggle: () => void;
};

const SpecContext = createContext<SpecContextValue>({
  enabled: false,
  toggle: () => {},
});

export function useSpec() {
  return useContext(SpecContext);
}

/**
 * Spec mode.
 *
 * The page ships its own design documentation. Toggling it on annotates the
 * live DOM — real measurements taken from real elements, not a picture of a
 * spec. Bound to ⌥S, plus a toggle in the corner for people who don't read
 * keyboard hints.
 */
export function SpecProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // ⌥S — `code` rather than `key`, since Option+S emits ß on macOS.
      if (event.altKey && event.code === "KeyS") {
        event.preventDefault();
        toggle();
      }
      if (event.key === "Escape") setEnabled(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  useEffect(() => {
    document.documentElement.dataset.spec = enabled ? "on" : "off";
  }, [enabled]);

  const value = useMemo(() => ({ enabled, toggle }), [enabled, toggle]);

  return <SpecContext.Provider value={value}>{children}</SpecContext.Provider>;
}
