'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  forgetTeam,
  getRecentTeams,
  getServerRecentTeams,
  subscribeRecentTeams,
} from '@/lib/recent-teams';
import { cx } from '@/lib/format';

/**
 * Which team the board is showing, and the way to another: the teams this browser remembers, the
 * model's own 15, a hand-built one, or a new id. A native `<details>` — it opens without
 * JavaScript and closes on an outside click with one listener.
 */
export function TeamSwitcher() {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const teams = useSyncExternalStore(subscribeRecentTeams, getRecentTeams, getServerRecentTeams);
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if (el.open && !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  // Close on navigation.
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  const id = params?.id;
  const current =
    id === 'recommended'
      ? "The model's 15"
      : id === 'built'
        ? 'Hand-built'
        : pathname === '/build'
          ? 'Building'
          : id
            ? (teams.find((t) => String(t.id) === id)?.name ?? `Team ${id}`)
            : 'Which team?';

  return (
    <details ref={ref} className="relative">
      <summary
        className="flex h-[34px] cursor-pointer list-none items-center gap-2 rounded-[9px] border border-line-strong bg-surface pl-3 pr-1.5 text-[13px] font-semibold text-ink [&::-webkit-details-marker]:hidden"
        aria-label="Switch team"
      >
        <span className="max-w-[9rem] truncate sm:max-w-[14rem]">{current}</span>
        <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-72 rounded-xl border border-line bg-surface p-1.5 shadow-[var(--shadow-raised)]">
        {teams.length > 0 && (
          <ul className="flex flex-col">
            {teams.map((t) => (
              <li key={t.id} className="flex items-center">
                <Link
                  href={`/team/${t.id}`}
                  className={cx(
                    'flex min-w-0 flex-1 flex-col rounded-lg px-2.5 py-2 hover:bg-surface-2',
                    String(t.id) === id && 'bg-surface-2',
                  )}
                >
                  <span className="truncate text-[13px] font-semibold text-ink">
                    {t.name ?? `Team ${t.id}`}
                  </span>
                  {t.name && <span className="num text-[11px] text-ink-3">{t.id}</span>}
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
        )}
        <div className={cx('flex flex-col', teams.length > 0 && 'mt-1 border-t border-line pt-1')}>
          <Link href="/team/recommended" className="rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
            The model&apos;s 15
          </Link>
          <Link href="/build" className="rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
            Build one by hand
          </Link>
          <Link href="/" className="rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
            Another team id…
          </Link>
        </div>
      </div>
    </details>
  );
}
