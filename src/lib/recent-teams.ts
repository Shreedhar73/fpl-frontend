/**
 * The team ids a reader has looked at, kept in their own browser and nowhere else. A convenience,
 * not an identity: the app stores nothing about anyone (D-013), and this list lives only in the
 * reader's localStorage, capped at five, and is rendered as absence when storage is unavailable.
 *
 * Exposed as an external store so `useSyncExternalStore` can read it with a server snapshot of
 * "nothing" — a server-rendered page cannot know what a browser remembers, and an effect that set
 * state after hydration would flash the empty state first.
 */
export interface RecentTeam {
  id: number;
  name: string | null;
  seenAt: string;
}

const KEY = 'fpl-advisor.recent-teams';
const EVENT = 'fpl-advisor:recent-teams';
const MAX = 5;
const EMPTY: RecentTeam[] = [];

let cached: RecentTeam[] | null = null;

function read(): RecentTeam[] {
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cached = Array.isArray(parsed)
      ? parsed.filter(
          (t): t is RecentTeam =>
            typeof t === 'object' &&
            t !== null &&
            Number.isInteger((t as RecentTeam).id) &&
            typeof (t as RecentTeam).seenAt === 'string',
        )
      : [];
  } catch {
    cached = [];
  }
  return cached;
}

function write(teams: RecentTeam[]): void {
  cached = teams;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(teams));
  } catch {
    // Storage full or blocked. The in-memory copy still serves this page.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function rememberTeam(id: number, name: string | null): void {
  if (typeof window === 'undefined') return;
  const rest = read().filter((t) => t.id !== id);
  write([{ id, name, seenAt: new Date().toISOString() }, ...rest].slice(0, MAX));
}

export function forgetTeam(id: number): void {
  if (typeof window === 'undefined') return;
  write(read().filter((t) => t.id !== id));
}

export function getRecentTeams(): RecentTeam[] {
  return typeof window === 'undefined' ? EMPTY : read();
}

export function getServerRecentTeams(): RecentTeam[] {
  return EMPTY;
}

export function subscribeRecentTeams(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cached = null;
      onChange();
    }
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
