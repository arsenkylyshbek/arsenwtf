"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { INTRO } from "@/content/site";

/**
 * The rail.
 *
 * Half navigation, half portrait. Items without a `section` are deliberate —
 * they name something true without promising content that doesn't exist yet.
 * To bring one live, add its id here and add a matching section to
 * content/site.ts. That's the whole edit.
 *
 * Section items are buttons, not anchors: they scroll the page directly, so
 * no `#` ever lands in the address bar. Items with an `href` are separate
 * routes; while one is open, section items first navigate home, then scroll.
 *
 * Two shapes, one component: the `rail` down the left on desktop, and on
 * phones a `dock` — the same items in a floating pill along the bottom edge,
 * scrolling sideways, with the same sliding indicator.
 */
type RailItem = {
  label: string;
  /** What the dock calls it, where the full label is too long for a pill. */
  short?: string;
  section?: string;
  href?: string;
};

/** Hands a section to the home page across a client navigation. */
const PENDING_SCROLL_KEY = "rail:pending-section";

const PRIMARY: RailItem[] = [
  { label: "arsen kylyshbek", short: "me", section: "me" },
  { label: "work", section: "work" },
  { label: "hangar", section: "hangar" },
  { label: "shaders", href: "/shaders" },
];

const LOVES: RailItem[] = [
  // friends folded into family: they appear in the photographs rather than as
  // a roster, which is how friendship actually shows up.
  { label: "family", section: "family" },
  { label: "places", section: "places" },
  { label: "football", section: "football" },
  { label: "airplanes", section: "airplanes" },
];

type Rect = { x: number; y: number; w: number; h: number };

/** Position of a row relative to the nav, for the indicators to travel to. */
function measureRow(nav: HTMLElement, section: string): Rect | null {
  const row = nav.querySelector<HTMLElement>(`[data-rail="${section}"]`);
  if (!row) return null;

  const navBox = nav.getBoundingClientRect();
  const rowBox = row.getBoundingClientRect();
  return {
    x: rowBox.left - navBox.left,
    y: rowBox.top - navBox.top,
    w: rowBox.width,
    h: rowBox.height,
  };
}

function indicatorStyle(rect: Rect | null) {
  return {
    transform: `translate3d(${rect?.x ?? 0}px, ${rect?.y ?? 0}px, 0)`,
    width: rect?.w ?? 0,
    height: rect?.h ?? 0,
    opacity: rect ? 1 : 0,
  };
}

export function SiteRail({ variant = "rail" }: { variant?: "rail" | "dock" }) {
  const dock = variant === "dock";
  const navRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [activeRect, setActiveRect] = useState<Rect | null>(null);
  const [hoverRect, setHoverRect] = useState<Rect | null>(null);

  /**
   * Whichever section is nearest the top of the viewport wins. Picking by
   * intersection ratio instead would flicker between two half-visible ones.
   */
  useEffect(() => {
    // On a separate route, that route's item is the active one.
    const route = PRIMARY.find((item) => item.href && pathname.startsWith(item.href));
    if (route) {
      const id = route.href!;
      const place = () => {
        setActive(id);
        const nav = navRef.current;
        setActiveRect(nav ? measureRow(nav, id) : null);
      };
      place();
      window.addEventListener("resize", place);
      document.fonts?.ready.then(place).catch(() => {});
      return () => window.removeEventListener("resize", place);
    }

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]"),
    );
    if (sections.length === 0) return;

    const pick = () => {
      let winner: string | null = null;
      let smallest = Infinity;

      for (const section of sections) {
        const top = section.getBoundingClientRect().top - 160;
        if (top <= 0 && Math.abs(top) < smallest) {
          smallest = Math.abs(top);
          winner = section.dataset.section ?? null;
        }
      }

      setActive(winner);
      const nav = navRef.current;
      setActiveRect(nav && winner ? measureRow(nav, winner) : null);
    };

    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    // Web fonts swapping in changes every label's width.
    document.fonts?.ready.then(pick).catch(() => {});

    // Arrived from another route via a section item: finish the trip.
    try {
      const pending = sessionStorage.getItem(PENDING_SCROLL_KEY);
      if (pending) {
        sessionStorage.removeItem(PENDING_SCROLL_KEY);
        document.getElementById(pending)?.scrollIntoView({ block: "start" });
      }
    } catch {
      // Storage blocked; landing at the top is fine.
    }

    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [pathname]);

  const scrollToSection = useCallback(
    (section: string) => {
      const target = document.getElementById(section);
      if (!target) {
        try {
          sessionStorage.setItem(PENDING_SCROLL_KEY, section);
        } catch {
          // Storage blocked; we'll just land at the top of home.
        }
        router.push("/");
        return;
      }
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    },
    [router],
  );

  // The dock scrolls sideways; keep the active pill in view as it moves.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!dock || !scroller || !activeRect) return;
    scroller.scrollTo({
      left: activeRect.x - (scroller.clientWidth - activeRect.w) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [dock, activeRect]);

  const trackHover = useCallback((section: string) => {
    const nav = navRef.current;
    if (nav) setHoverRect(measureRow(nav, section));
  }, []);

  const rowClass = dock ? "flex h-9 shrink-0 items-center" : "flex h-8 items-center";
  const labelOf = (item: RailItem) => (dock ? (item.short ?? item.label) : item.label);

  const renderRow = (item: RailItem) => {
    if (item.href) {
      const isActive = item.href === active;
      return (
        <li key={item.label} className={rowClass}>
          <Link
            href={item.href}
            data-rail={item.href}
            aria-current={isActive ? "page" : undefined}
            onPointerEnter={() => trackHover(item.href!)}
            onFocus={() => trackHover(item.href!)}
            className={`rail-item ${
              isActive ? "rail-item-active" : "text-ink-muted hover:text-ink"
            }`}
          >
            {labelOf(item)}
          </Link>
        </li>
      );
    }

    if (!item.section) {
      return (
        <li key={item.label} className={rowClass}>
          <span className="rail-item cursor-default text-ink-faint select-none">
            {labelOf(item)}
          </span>
        </li>
      );
    }

    const isActive = item.section === active;

    return (
      <li key={item.label} className={rowClass}>
        <button
          type="button"
          data-rail={item.section}
          aria-current={isActive ? "true" : undefined}
          onClick={() => scrollToSection(item.section!)}
          onPointerEnter={() => trackHover(item.section!)}
          onFocus={() => trackHover(item.section!)}
          className={`rail-item ${
            isActive ? "rail-item-active" : "text-ink-muted hover:text-ink"
          }`}
        >
          {labelOf(item)}
        </button>
      </li>
    );
  };

  const indicators = (
    <>
      <div
        aria-hidden
        className="rail-indicator rail-indicator-hover"
        style={indicatorStyle(hoverRect)}
      />
      <div
        aria-hidden
        className="rail-indicator rail-indicator-active"
        style={indicatorStyle(activeRect)}
      />
    </>
  );

  if (dock) {
    return (
      <div ref={scrollerRef} className="dock">
        <nav ref={navRef} aria-label="site" className="relative flex w-max items-center">
          {indicators}
          <ul className="flex items-center gap-1">{PRIMARY.map(renderRow)}</ul>
          <span aria-hidden className="dock-divider" />
          <ul className="flex items-center gap-1">{LOVES.map(renderRow)}</ul>
        </nav>
      </div>
    );
  }

  return (
    <nav
      ref={navRef}
      aria-label="site"
      className="relative"
      onPointerLeave={() => setHoverRect(null)}
      onBlur={() => setHoverRect(null)}
    >
      {indicators}

      <ul>{PRIMARY.map(renderRow)}</ul>

      <p className="meta mt-8 mb-1 text-ink-faint">
        what i love
      </p>

      <ul>{LOVES.map(renderRow)}</ul>

      {/* Desktop only — the rail's full stop. On mobile these stay up in the
          intro, where the rail is just a stacked list and a footer of links
          under it would be a long scroll from the name they belong to.
          Rendered in both places and switched with display, so only one is
          ever in the accessibility tree. */}
      <div className="mt-10 hidden flex-wrap items-center gap-x-3 gap-y-1 md:flex">
        {INTRO.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="pill text-ink-faint hover:text-ink"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
