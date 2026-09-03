'use client';

import { useSyncExternalStore } from 'react';
import { cx, utcTimestamp } from '@/lib/format';

/**
 * "Fri 4 Sep · 23:15" in the reader's zone plus "1d 4h" to go. The HTML ships the UTC form; this
 * re-renders once hydrated and then once a minute. Under an hour the tone turns to warn, past the
 * deadline it says so — a board read after the lock is a different thing and should look it.
 */
function remaining(iso: string, now: number): { text: string; tone: 'neutral' | 'warn' | 'past' } {
  const ms = new Date(iso).getTime() - now;
  if (Number.isNaN(ms)) return { text: '', tone: 'neutral' };
  if (ms <= 0) return { text: 'locked', tone: 'past' };
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d > 0) return { text: `${d}d ${h}h`, tone: 'neutral' };
  if (h > 0) return { text: `${h}h ${mm}m`, tone: h < 1 ? 'warn' : 'neutral' };
  return { text: `${mm}m`, tone: 'warn' };
}

function subscribeMinute(onChange: () => void): () => void {
  const t = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(t);
}
function minuteNow(): number {
  return Math.floor(Date.now() / 60_000) * 60_000;
}
function serverNow(): null {
  return null;
}

function localDeadline(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(d)
    .replace(',', ' ·');
}

export function Countdown({
  iso,
  gameweekId,
  compact,
}: {
  iso: string;
  gameweekId: number;
  compact: boolean;
}) {
  // The clock as an external store: null on the server, the minute on the client, re-read each
  // minute. No effect, no setState — the store notifies and React re-renders.
  const now = useSyncExternalStore(subscribeMinute, minuteNow, serverNow);

  const left = now === null ? null : remaining(iso, now);
  const when = now === null ? `${utcTimestamp(iso)}` : localDeadline(iso);

  return (
    <>
      {!compact && (
        <time dateTime={iso} className="num text-[13px] font-bold text-ink">
          {when}
        </time>
      )}
      {left && left.text && (
        <span
          className={cx(
            'num inline-flex h-[22px] items-center rounded-md px-2 text-[11.5px] font-bold',
            left.tone === 'past' && 'bg-surface-3 text-ink-2',
            left.tone === 'warn' && 'bg-[color-mix(in_oklab,var(--bad)_18%,transparent)] text-bad',
            left.tone === 'neutral' && 'bg-[color-mix(in_oklab,var(--warn)_18%,transparent)] text-warn',
          )}
          title={`Gameweek ${gameweekId} deadline, ${utcTimestamp(iso)}`}
        >
          {compact ? `GW ${gameweekId} · ${left.text}` : left.text}
        </span>
      )}
      {!left && compact && (
        <span className="num inline-flex h-[22px] items-center rounded-md bg-surface-3 px-2 text-[11.5px] font-bold text-ink-2">
          GW {gameweekId}
        </span>
      )}
    </>
  );
}
