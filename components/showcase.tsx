"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Entry } from "@/content/site";
import { SpecBox } from "@/components/spec/spec-box";

/**
 * The sites themselves, after the index of them.
 *
 * Ported from hattori's work carousel: a frame stays fixed in the middle and
 * the screenshots slide through it, the neighbours peeking in at either edge.
 * Swipe, drag, arrow keys, or click a neighbour to bring it in; click the
 * framed one to open the live site.
 */
export function Showcase({ entries }: { entries: Entry[] }) {
  const slides = entries.filter((e) => e.shot);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Whichever slide is mostly inside the frame is the active one.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (items) => {
        for (const item of items) {
          if (item.isIntersecting) setActive(Number((item.target as HTMLElement).dataset.i));
        }
      },
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll(".showcase-slide").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Mouse drag to scroll; touch and trackpads scroll natively.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let x0 = 0;
    let s0 = 0;
    let down = false;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      moved = false;
      x0 = e.clientX;
      s0 = el.scrollLeft;
      el.classList.add("dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = s0 - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      el.classList.remove("dragging");
    };
    // A drag shouldn't count as a click on the slide's link.
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  const go = (i: number) => {
    const el = track.current;
    const target = el?.querySelectorAll<HTMLElement>(".showcase-slide")[
      Math.max(0, Math.min(slides.length - 1, i))
    ];
    if (el && target) {
      el.scrollTo({
        left: target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    }
  };

  if (slides.length === 0) return null;
  const current = slides[active];
  const href = current.links?.[0]?.href;
  const domain = href ? new URL(href).hostname.replace(/^www\./, "") : undefined;

  return (
    <SpecBox label="carousel · 16:9 · radius/md" className="showcase mt-16">
      <div className="showcase-viewport">
        <div
          ref={track}
          className="showcase-track"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="sites from the hangar"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              go(active + 1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              go(active - 1);
            }
          }}
        >
          {slides.map((slide, i) => {
            const link = slide.links?.[0]?.href;
            const image = (
              <Image
                src={slide.shot!}
                alt={`${slide.title} homepage`}
                width={2400}
                height={1350}
                sizes="(max-width: 768px) 86vw, 600px"
                draggable={false}
              />
            );
            return (
              <article
                key={slide.id}
                data-i={i}
                className={`showcase-slide ${i === active ? "on" : ""}`}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}: ${slide.title}`}
              >
                {link ? (
                  <a
                    className="showcase-shot"
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    draggable={false}
                    aria-label={i === active ? `${slide.title}, open site` : `show ${slide.title}`}
                    onClick={(e) => {
                      // Outside the frame a click only brings it in; framed, it opens the site.
                      if (i !== active) {
                        e.preventDefault();
                        go(i);
                      }
                    }}
                  >
                    {image}
                  </a>
                ) : (
                  <div className="showcase-shot" onClick={() => i !== active && go(i)}>
                    {image}
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {/* The frame stays put; the work slides through it. */}
        <div className="showcase-lens" aria-hidden />
      </div>

      <div className="showcase-info" key={current.id} aria-live="polite">
        <div className="flex items-center gap-3">
          <span className="pill pill-accent showcase-chip">{current.title}</span>
          {domain && <span className="meta text-ink-faint">{domain}</span>}
        </div>
        {current.body?.[0] && (
          <p className="mt-3 max-w-[56ch] text-pretty text-ink-muted">{current.body[0]}</p>
        )}
      </div>
    </SpecBox>
  );
}
