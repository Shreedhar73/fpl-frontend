import type { CSSProperties, ReactNode } from 'react';
import { cx } from '@/lib/format';

/**
 * Two magnitude marks, both plain `div`s. A charting library in the initial bundle would blow the
 * per-route JS budget on its own (`fpl-performance-budget`), and neither of these is a chart:
 * they are a single value against a maximum.
 *
 * The fill width rides on a CSS custom property rather than a computed class name — Tailwind only
 * emits classes it can see in the source, so `w-[73%]` built at runtime would render as no width
 * at all.
 */

function fillStyle(value: number, max: number, color?: string): CSSProperties {
  const share = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  return { '--fill': share, backgroundColor: color } as CSSProperties;
}

/** An inline bar, for a value read beside its number — expected points across a table column. */
export function Bar({
  value,
  max,
  color,
  className,
}: {
  value: number;
  max: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        'block h-1.5 w-full overflow-hidden rounded-full bg-surface-3',
        className,
      )}
    >
      <span
        className="bar-fill block h-full rounded-full bg-ink-2"
        style={fillStyle(value, max, color)}
      />
    </span>
  );
}

/**
 * A labelled meter with its own numbers — budget spent, a position quota filled. `tone` is the
 * state of the thing being measured, not decoration: over-quota is the only red.
 */
export function Meter({
  label,
  value,
  max,
  display,
  tone = 'neutral',
}: {
  label: ReactNode;
  value: number;
  max: number;
  display?: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) {
  const color =
    tone === 'bad'
      ? 'var(--bad)'
      : tone === 'warn'
        ? 'var(--warn)'
        : tone === 'good'
          ? 'var(--good)'
          : 'var(--ink-2)';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-3">
          {label}
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color: tone === 'neutral' ? undefined : color }}
        >
          {display ?? `${value}/${max}`}
        </span>
      </div>
      <span
        aria-hidden
        className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
      >
        <span
          className="bar-fill block h-full rounded-full"
          style={fillStyle(value, max, color)}
        />
      </span>
    </div>
  );
}
