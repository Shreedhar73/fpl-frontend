/**
 * Every number the app renders passes through here. Formatting at the render edge is a rule rather
 * than a habit: money arrives in tenths of a million and any arithmetic on a formatted string is a
 * bug that reads as a rounding error.
 */

/** Tenths of a million, the way FPL writes money. `55` is £5.5m. */
export function money(tenths: number): string {
  return `£${(tenths / 10).toFixed(1)}m`;
}

/** Expected points. One decimal everywhere — two implied a precision the model does not have. */
export function points(n: number): string {
  return n.toFixed(1);
}

/** A signed difference, for anything framed as "against" something else. */
export function delta(n: number): string {
  const rounded = Math.abs(n) < 0.05 ? 0 : n;
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(1)}`;
}

/** A probability in 0…1 as a whole percentage. */
export function percent(p: number): string {
  return `${Math.round(p * 100)}%`;
}

/**
 * `generatedAt` in UTC, which is what a server component can honestly render: it formats in the
 * server's zone, not the reader's. `<LocalTime>` re-renders this in the browser's zone once
 * hydrated; this string is what ships in the HTML and what a JS-less reader sees.
 */
export function utcTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toISOString().slice(11, 16)} UTC`;
}

/** The same instant in the reader's own zone, with the zone named. Browser only. */
export function localTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(d);
}

/** The full instant, for a `title` — the short form drops the date, and a stale page needs it. */
export function fullTimestamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

/** Class-name helper. Small enough to own rather than take a dependency for. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
