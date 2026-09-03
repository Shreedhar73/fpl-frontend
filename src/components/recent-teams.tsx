'use client';

import Link from 'next/link';
import { useEffect, useSyncExternalStore } from 'react';
import {
  forgetTeam,
  getRecentTeams,
  getServerRecentTeams,
  rememberTeam,
  subscribeRecentTeams,
} from '@/lib/recent-teams';
import { cx } from '@/lib/format';

/**
 * The team ids this browser has looked at, as links. Renders nothing on the server and nothing
 * when storage is empty or unavailable, so the page around it never depends on it.
 */
export function RecentTeams({
  className,
  title = 'Recently viewed',
}: {
  className?: string;
  title?: string;
}) {
  const teams = useSyncExternalStore(
    subscribeRecentTeams,
    getRecentTeams,
    getServerRecentTeams,
  );
  if (teams.length === 0) return null;

  return (
    <div className={cx('flex flex-wrap items-center gap-2', className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        {title}
      </span>
      {teams.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center overflow-hidden rounded-full border border-line bg-surface text-xs"
        >
          <Link
            href={`/squad/${t.id}`}
            className="px-2.5 py-1 font-medium text-ink hover:bg-surface-2"
          >
            {t.name ?? `Team ${t.id}`}
            {t.name && (
              <span className="ml-1 font-normal tabular-nums text-ink-3">{t.id}</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => forgetTeam(t.id)}
            aria-label={`Forget team ${t.id}`}
            className="border-l border-line px-1.5 py-1 text-ink-3 hover:bg-surface-2 hover:text-ink"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

/** Writes the viewed team into the list. Renders nothing; an effect is the right tool for a write. */
export function RememberTeam({ id, name }: { id: number; name: string | null }) {
  useEffect(() => {
    rememberTeam(id, name);
  }, [id, name]);
  return null;
}
