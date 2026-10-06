import data from "@/content/cities.json";

export type City = {
  key: string;
  name: string;
  timezone: string;
  center: [number, number];
  zoom: number;
  bbox: [number, number, number, number];
  contourStep: number;
};

/** Same file the data build script reads, so bounds can never disagree. */
export const CITIES: City[] = Object.entries(data).map(([key, c]) => ({
  key,
  ...(c as Omit<City, "key">),
}));

/** Where the .pmtiles live: R2 in production, public/maps in dev. */
export const TILES_BASE = process.env.NEXT_PUBLIC_MAP_TILES_URL ?? "/maps";
