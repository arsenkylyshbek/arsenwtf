"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { CITIES, type City } from "@/lib/city-map/cities";
import { formatClock, instantAt, localMinutes, nightness } from "@/lib/city-map/time";
import { SpecBox } from "@/components/spec/spec-box";
import type { FlyTarget } from "./city-map";

// MapLibre is ~220 KB; it loads only when this page does, never site-wide.
const CityMap = dynamic(() => import("./city-map").then((m) => m.CityMap), {
  ssr: false,
});

type Result = { id: string; label: string; detail: string; center: [number, number] };

/** Photon (OpenStreetMap geocoder), boxed to the city so results stay local. */
async function geocode(query: string, city: City, signal: AbortSignal): Promise<Result[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "5",
    lang: "en",
    bbox: city.bbox.join(","),
  });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    features: {
      geometry: { coordinates: [number, number] };
      properties: Record<string, string | undefined>;
    }[];
  };
  return json.features.map((f, i) => {
    const p = f.properties;
    const street = [p.housenumber, p.street].filter(Boolean).join(" ");
    const label = (p.name ?? street) || "unnamed place";
    const detail = [p.name ? street : undefined, p.district ?? p.locality]
      .filter(Boolean)
      .join(", ");
    return {
      id: `${p.osm_type}${p.osm_id}-${i}`,
      label: label.toLowerCase(),
      detail: detail.toLowerCase(),
      center: f.geometry.coordinates,
    };
  });
}

export function CityStudio() {
  const [cityKey, setCityKey] = useState(CITIES[0].key);
  const city = CITIES.find((c) => c.key === cityKey) ?? CITIES[0];

  // null = follow the city's real clock; a number = the slider has taken over.
  const [override, setOverride] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock starts after hydration
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const minutes = now ? (override ?? localMinutes(city.timezone, now)) : null;
  const night = useMemo(() => {
    if (minutes === null || !now) return 1;
    const [lon, lat] = city.center;
    return nightness(instantAt(city.timezone, minutes, now), lat, lon);
  }, [city, minutes, now]);

  const switchCity = (key: string) => {
    setCityKey(key);
    setOverride(null);
    setQuery("");
    setResults([]);
  };

  // --- address search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [fly, setFly] = useState<FlyTarget | null>(null);
  const flyId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(() => {
      geocode(q, city, controller.signal).then(setResults).catch(() => {});
    }, 350);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, city]);

  const pick = (r: Result) => {
    setFly({ center: r.center, zoom: 16, id: ++flyId.current });
    setQuery(r.label);
    setResults([]);
  };

  const fill = minutes === null ? 0 : (minutes / 1439) * 100;

  return (
    <div>
      <SpecBox label="nav · body/16 · Inter 400">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {CITIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => switchCity(c.key)}
                className={`pill ${c.key === cityKey ? "pill-accent" : "text-ink-muted hover:text-ink"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <p className="meta text-ink-muted tabular-nums" aria-live="polite">
            {city.name} · {minutes === null ? "--:--" : formatClock(minutes)}
          </p>
        </div>
      </SpecBox>

      <SpecBox label="map · 16:11 · radius/md" className="mt-6">
        <div className="shader-window aspect-[16/11]" style={{ background: night > 0.5 ? "#0c0e15" : "#f5f0e4" }}>
          <CityMap city={city} night={night} fly={fly} />
          {/* The site's own paper grain, laid over the day map so it reads as
              printed. Fades out as the city goes dark. */}
          <div
            aria-hidden
            className="paper-grain pointer-events-none absolute inset-0 z-10"
            style={{ opacity: 0.2 * (1 - night) }}
          />
        </div>
      </SpecBox>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <p className="meta text-ink-faint">© openstreetmap contributors · protomaps</p>
        <p className="meta text-ink-faint">
          <span className="[@media(hover:none)]:hidden">ctrl / ⌘ + scroll to zoom</span>
          <span className="hidden [@media(hover:none)]:inline">two fingers to zoom</span>
        </p>
      </div>

      <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        <SpecBox label="fieldset · body/16 · Inter 400">
          <fieldset>
            <legend className="meta mb-2 text-ink-faint">time</legend>
            <div className="grid h-9 grid-cols-[1fr_auto] items-center gap-4">
              <input
                type="range"
                aria-label={`time of day in ${city.name}`}
                min={0}
                max={1439}
                step={5}
                value={minutes ?? 0}
                onChange={(e) => setOverride(+e.target.value)}
                className="shader-range"
                style={{ "--fill": `${fill}%` } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setOverride(null)}
                className={`pill meta ${override === null ? "pill-accent" : "text-ink-muted hover:text-ink"}`}
              >
                now
              </button>
            </div>
            <p className="meta mt-1 text-ink-faint">
              {override === null ? `live — the real time in ${city.name}` : "scrubbing — tap now to go live"}
            </p>
          </fieldset>
        </SpecBox>

        <SpecBox label="search · body/16 · Inter 400">
          <div className="relative">
            <label htmlFor="city-search" className="meta mb-2 block text-ink-faint">
              address
            </label>
            <input
              id="city-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) pick(results[0]);
                if (e.key === "Escape") setResults([]);
              }}
              placeholder={`somewhere in ${city.name}`}
              className="city-search"
            />
            {results.length > 0 && (
              <ul className="city-results">
                {results.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => pick(r)} className="city-result">
                      <span className="text-ink">{r.label}</span>
                      {r.detail && <span className="text-ink-faint"> {r.detail}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SpecBox>
      </div>
    </div>
  );
}
