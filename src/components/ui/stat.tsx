import type { ReactNode } from 'react';
import { cx } from '@/lib/format';

/**
 * A headline number with the words that make it mean something. The hint is not optional padding:
 * a bare "3.9" on a page of derived numbers is unreadable, and every tile here answers "of what".
 */
export function Stat({
  label,
  value,
  unit,
  hint,
  tone = 'neutral',
  className,
  size = 'md',
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
  className?: string;
  size?: 'sm' | 'md';
}) {
  const valueColor =
    tone === 'good'
      ? 'text-good'
      : tone === 'warn'
        ? 'text-warn'
        : tone === 'bad'
          ? 'text-bad'
          : 'text-ink';

  return (
    <div
      className={cx(
        'rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]',
        size === 'sm' ? 'p-2.5' : 'p-3 sm:p-4',
        className,
      )}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
        {label}
      </dt>
      <dd className="mt-1 flex items-baseline gap-1">
        <span
          className={cx(
            'truncate font-semibold tabular-nums tracking-tight',
            size === 'sm' ? 'text-lg' : 'text-xl sm:text-2xl',
            valueColor,
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-ink-3">{unit}</span>}
      </dd>
      {hint && <p className="mt-1 text-[11px] leading-4 text-ink-3">{hint}</p>}
    </div>
  );
}
