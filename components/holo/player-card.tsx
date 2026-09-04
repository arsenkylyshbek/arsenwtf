"use client";

import { useEffect, useRef } from "react";
import type { Entry } from "@/content/site";
import {
  Follow,
  Kick,
  Orientation,
  applyFoil,
  applyFrame,
  foilByKey,
  fromPointer,
} from "./engine";

/**
 * A football card, in the shape of a FIFA one: shirt number and position top
 * left, club and city in the middle, a three-stat row at the foot.
 *
 * Two followers at different weights. The card tracks quickly; the foil is
 * heavier and arrives a few frames later, so the surface catches up to the
 * card rather than moving with it. That lag is most of what separates this
 * from a gradient following a cursor.
 */
export function PlayerCard({ entry }: { entry: Entry }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const card = entry.card!;
  const foil = foilByKey(card.foil);

  // Material variables are written straight to the element rather than passed
  // as style props: the frame loop already owns this element's style, and
  // mixing the two would have React clobber the loop's writes on re-render.
  useEffect(() => {
    if (cardRef.current) applyFoil(cardRef.current, foil);
  }, [foil]);

  useEffect(() => {
    const host = hostRef.current;
    const el = cardRef.current;
    if (!host || !el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const tilt = new Follow(0.16);
    const sheet = new Follow(0.09);
    const kick = new Kick();
    const t0 = performance.now();

    let raf = 0;
    let running = false;
    let onScreen = false;
    let hidden = false;
    /** A slow wander when untouched, so the card is alive before you reach it. */
    let idle = 0;
    let touched = false;
    /** How far through the return-to-rest blend we are, 0..1. */
    let release = 1;
    let handoff = { x: 0, y: 0 };
    /** The same blend on the way IN. The pointer arrives far from wherever the
     *  card had drifted to, so taking it as the target immediately is a jump of
     *  most of the card's travel in one frame. */
    let grab = 1;
    let grabFrom = { x: 0, y: 0 };
    let aim = { x: 0, y: 0 };

    const frame = () => {
      raf = 0;

      if (!touched) {
        // Two incommensurate rates, so the resting drift never visibly repeats.
        idle += 0.0042;
        const drift = {
          x: Math.sin(idle) * 0.28,
          y: Math.cos(idle * 0.73) * 0.2,
        };
        // EASE BACK INTO THE DRIFT, don't cut to it. The drift's phase keeps
        // advancing while you hover, so at the moment you leave it is somewhere
        // unrelated to where the card points. Handing the target straight over
        // teleports it.
        release = Math.min(1, release + 0.016);
        const k = release * release;
        tilt.target = {
          x: handoff.x + (drift.x - handoff.x) * k,
          y: handoff.y + (drift.y - handoff.y) * k,
        };
      } else {
        grab = Math.min(1, grab + 0.018);
        const k = grab * grab;
        tilt.target = {
          x: grabFrom.x + (aim.x - grabFrom.x) * k,
          y: grabFrom.y + (aim.y - grabFrom.y) * k,
        };
      }

      // The release overshoot rides ON TOP of the target rather than replacing
      // it, so the drift logic stays untouched and the bounce decays away.
      const k = kick.step();
      if (k.x || k.y) {
        tilt.target = { x: tilt.target.x + k.x, y: tilt.target.y + k.y };
      }

      tilt.step();
      sheet.target = tilt.value;
      sheet.step();

      applyFrame(el, tilt.value, sheet.value, foil, {
        speed: sheet.speed,
        velocity: sheet.velocity,
        time: (performance.now() - t0) / 1000,
      });

      // Keep running while the blend is mid-flight: the followers can be
      // "settled" against a target that is itself still moving.
      if (
        running &&
        (!touched ||
          release < 1 ||
          grab < 1 ||
          kick.active ||
          !tilt.settled ||
          !sheet.settled)
      ) {
        raf = requestAnimationFrame(frame);
      }
    };

    const wake = () => {
      if (!running || raf) return;
      raf = requestAnimationFrame(frame);
    };

    const onPointer = (e: PointerEvent) => {
      aim = fromPointer(host.getBoundingClientRect(), e.clientX, e.clientY);
      if (!touched) {
        // FIRST contact only: restarting the pick-up on every move would
        // permanently lag the card behind the cursor.
        touched = true;
        grabFrom = { x: tilt.value.x, y: tilt.value.y };
        grab = 0;
      }
      release = 0;
      wake();
    };

    const onLeave = () => {
      touched = false;
      handoff = { x: tilt.value.x, y: tilt.value.y };
      release = 0;
      grab = 1;
      // Carry past a little on the axis you were pushing, scaled by the speed
      // at release — a flick throws it, setting it down does nothing.
      kick.fire(tilt.velocity);
      wake();
    };

    const sync = () => {
      const should = onScreen && !hidden;
      if (should === running) return;
      running = should;
      if (should) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es.some((e) => e.isIntersecting);
        sync();
      },
      { rootMargin: "200px" },
    );
    io.observe(host);

    const onVis = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);

    // Device orientation with no opt-in of its own: on Android events simply
    // arrive, and on iOS they never fire without a gesture, so the card falls
    // back to its idle drift there — the same thing it does on a desktop with
    // no pointer over it.
    const orient = new Orientation();
    const onOrient = (e: DeviceOrientationEvent) => {
      const v = orient.read(e);
      if (!v) return;
      touched = true;
      grab = 1;
      aim = v;
      wake();
    };

    host.addEventListener("pointermove", onPointer);
    host.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onOrient);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [foil]);

  return (
    <div ref={hostRef} className="holo-scene">
      <div ref={cardRef} className="holo-card">
        <div className="holo-body" />

        <div className="holo-foil" />
        <div className="holo-foil--b" />
        <div className="holo-foil--c" />

        <div className="holo-smear" />
        <div className="holo-spot" />
        <div className="holo-noise" />
        <div className="holo-glare" />
        <div className="holo-edges" />

        <div className="holo-content">
          <div className="flex items-start justify-between">
            <span className="holo-number">{card.number}</span>
            <span className="holo-position">{card.position}</span>
          </div>

          {/* mt-auto bottom-anchors everything below it, and the stat row is
              last — so the three cards' stat rows line up across the grid even
              though their club names run to different numbers of lines. The
              honour sits ABOVE the stats for the same reason: below, it pushed
              one card's row out of alignment with the other two. */}
          <div className="mt-auto">
            <p className="holo-club">{entry.title}</p>
            {entry.note && <p className="holo-position mt-1">{entry.note}</p>}
            {card.honour && (
              <p className="holo-stat-label mt-2">{card.honour}</p>
            )}
          </div>

          <div className="holo-stats mt-3">
            {card.stats.map((stat) => (
              <div key={stat.label}>
                <div className="holo-stat-value">{stat.value}</div>
                <div className="holo-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
