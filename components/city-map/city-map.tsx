"use client";

import { useEffect, useRef } from "react";
import { addProtocol, Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl";
import { version as maplibreVersion } from "maplibre-gl/package.json";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";

import { TILES_BASE, type City } from "@/lib/city-map/cities";
import { applyTime, buildStyle, TRAFFIC_LAYER } from "@/lib/city-map/style";

// Registered once per page load; every map shares it.
let protocolAdded = false;
function ensureProtocol() {
  if (protocolAdded) return;
  // Copied into public/ by scripts/copy-maplibre-worker.mjs on install.
  setWorkerUrl(`/vendor/maplibre/${maplibreVersion}/maplibre-gl-worker.mjs`);
  addProtocol("pmtiles", new Protocol().tile);
  protocolAdded = true;
}

// MapLibre's own "animate a line" sequence: one dash slides along the gap.
const DASHES = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
];
const TRAFFIC_FPS = 12;

const absolute = (base: string) =>
  base.startsWith("http") ? base : new URL(base, window.location.origin).href;

function padded([w, s, e, n]: City["bbox"]): [[number, number], [number, number]] {
  const dx = (e - w) * 0.15;
  const dy = (n - s) * 0.15;
  return [[w - dx, s - dy], [e + dx, n + dy]];
}

export type FlyTarget = { center: [number, number]; zoom?: number; id: number };

/**
 * The map itself. Owns one MapLibre instance for the life of the component;
 * switching city swaps the style (and its two tile files) rather than
 * rebuilding the map, and the time of day only re-tints paint properties.
 *
 * MapLibre only redraws on change. The one thing that keeps it drawing is the
 * traffic, so that loop runs at 12fps, only at night, and only on screen.
 */
export function CityMap({
  city,
  night,
  fly,
}: {
  city: City;
  /** 0 = day, 1 = night. */
  night: number;
  fly?: FlyTarget | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const nightRef = useRef(night);
  const cityRef = useRef(city);
  const kickRef = useRef<(() => void) | null>(null);
  // True once the style JSON is parsed (tiles may still be streaming in) —
  // the earliest moment setPaintProperty is allowed.
  const styleReadyRef = useRef(false);
  const pinRef = useRef<Marker | null>(null);

  useEffect(() => {
    nightRef.current = night;
  }, [night]);

  // Create once.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    ensureProtocol();
    const first = cityRef.current;

    const map = new MapLibreMap({
      container: host,
      style: buildStyle(absolute(TILES_BASE), first.key, nightRef.current),
      center: first.center,
      zoom: first.zoom,
      minZoom: 10,
      maxZoom: 17.5,
      maxBounds: padded(first.bbox),
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      renderWorldCopies: false,
      cooperativeGestures: true,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "ctrl + scroll to zoom",
        "CooperativeGesturesHandler.MacHelpText": "⌘ + scroll to zoom",
        "CooperativeGesturesHandler.MobileHelpText": "two fingers to move the map",
      },
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    // Fires for the first style and after every city swap. Re-tint here so a
    // time change made while the new style was loading still lands.
    map.on("style.load", () => {
      styleReadyRef.current = true;
      applyTime(map, nightRef.current);
    });

    // Traffic: step the dash pattern while it's night and the map is visible.
    let raf = 0;
    let last = 0;
    let step = 0;
    let visible = true;
    const tick = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || nightRef.current < 0.05) return;
      raf = requestAnimationFrame(tick);
      if (now - last < 1000 / TRAFFIC_FPS) return;
      last = now;
      step = (step + 1) % DASHES.length;
      if (map.getLayer(TRAFFIC_LAYER)) {
        map.setPaintProperty(TRAFFIC_LAYER, "line-dasharray", DASHES[step]);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", kick);
    map.on("load", kick);
    kickRef.current = kick;

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", kick);
      map.remove();
      mapRef.current = null;
      kickRef.current = null;
    };
  }, []);

  // City change: new style + bounds + camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || cityRef.current.key === city.key) return;
    cityRef.current = city;
    styleReadyRef.current = false;
    pinRef.current?.remove();
    map.setMaxBounds(null);
    map.setStyle(buildStyle(absolute(TILES_BASE), city.key, nightRef.current), { diff: false });
    map.jumpTo({ center: city.center, zoom: city.zoom });
    map.setMaxBounds(padded(city.bbox));
  }, [city]);

  // Time of day: re-tint in place.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (styleReadyRef.current) applyTime(map, night);
    kickRef.current?.();
  }, [night]);

  // Address search result.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fly) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map[reduce ? "jumpTo" : "flyTo"]({ center: fly.center, zoom: fly.zoom ?? 16, essential: true });
    if (!pinRef.current) {
      const el = document.createElement("div");
      el.className = "city-pin";
      pinRef.current = new Marker({ element: el });
    }
    pinRef.current.setLngLat(fly.center).addTo(map);
  }, [fly]);

  // MapLibre's CSS forces its container to position: relative, so the
  // absolute positioning lives on a wrapper.
  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="h-full w-full" />
    </div>
  );
}
