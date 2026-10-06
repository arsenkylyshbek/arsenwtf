/**
 * Time and sun for the city map.
 *
 * Every city runs on its own clock: the map shows what the sky over that city
 * is doing right now, not what the visitor's is. The slider then scrubs that
 * city's day, so "14:00" means 2pm *there*.
 */

const RAD = Math.PI / 180;

/** Solar elevation in degrees (NOAA approximation, good to ~0.5°). */
export function sunElevation(date: Date, lat: number, lon: number): number {
  const days = date.getTime() / 86_400_000 - 10_957.5; // since J2000
  const meanLon = (280.46 + 0.9856474 * days) % 360;
  const anomaly = ((357.528 + 0.9856003 * days) % 360) * RAD;
  const eclipticLon =
    (meanLon + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * days) * RAD;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLon));
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLon),
    Math.cos(eclipticLon),
  );
  const siderealHours = (18.697374558 + 24.06570982441908 * days) % 24;
  const hourAngle = (siderealHours * 15 + lon) * RAD - rightAscension;
  const altitude = Math.asin(
    Math.sin(lat * RAD) * Math.sin(declination) +
      Math.cos(lat * RAD) * Math.cos(declination) * Math.cos(hourAngle),
  );
  return altitude / RAD;
}

/**
 * 0 = full day, 1 = full night. The blend runs from the sun 4° up (golden hour)
 * to 8° down (past civil twilight), so dusk lasts as long as it really does
 * at that latitude — long in Astana and London in June, short in SF.
 */
export function nightness(date: Date, lat: number, lon: number): number {
  const e = sunElevation(date, lat, lon);
  const t = Math.min(1, Math.max(0, (4 - e) / 12));
  return t * t * (3 - 2 * t);
}

/** Minutes the zone is ahead of UTC at `date` (DST-aware). */
function zoneOffsetMinutes(timeZone: string, date: Date): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = name?.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Minutes past local midnight in `timeZone`. */
export function localMinutes(timeZone: string, date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/** The instant at which it is `minutes` past midnight, today, in `timeZone`. */
export function instantAt(timeZone: string, minutes: number, now = new Date()): Date {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // YYYY-MM-DD
  const [y, mo, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d, 0, minutes);
  return new Date(guess - zoneOffsetMinutes(timeZone, new Date(guess)) * 60_000);
}

export const formatClock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(
    Math.floor(minutes % 60),
  ).padStart(2, "0")}`;
