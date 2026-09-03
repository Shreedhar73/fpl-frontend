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
 * The teams this browser has looked at, as rows on the entry page. Renders nothing on the server
 * and nothing when storage is empty or unavailable, so the page around it never depends on it.
 */
export function RecentTeamRows({ className }: { className?: string }) {
  const teams = useSyncExternalStore(subscribeRecentTeams, getRecentTeams, getServerRecentTeams);
  if (teams.length === 0) return null;

  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Your teams</span>
      <ul className="flex flex-col border-t border-line">
        {teams.map((t) => (
          <li key={t.id} className="flex items-center gap-3 border-b border-line">
            <Link href={`/team/${t.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 hover:text-ink">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-semibold text-ink">{t.name ?? `Team ${t.id}`}</span>
                <span className="num text-xs text-ink-3">
                  {t.name ? `Team ${t.id} · ` : ''}last opened {new Date(t.seenAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </span>
              </span>
              <svg aria-hidden viewBox="0 0 24 24" className="ml-auto size-4 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <button
              type="button"
              onClick={() => forgetTeam(t.id)}
              aria-label={`Forget team ${t.id}`}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
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
