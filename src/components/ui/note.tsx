import type { ReactNode } from 'react';
import { cx } from '@/lib/format';

/**
 * The app says "we do not know this" more often than most, and that is a feature: an honest gap
 * beats a plausible number. So the shape that carries a limitation is a first-class component
 * rather than a paragraph in grey.
 */
export function Note({
  title,
  tone = 'info',
  children,
  className,
}: {
  title?: ReactNode;
  tone?: 'info' | 'limit' | 'warn';
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'rounded-xl p-3 text-xs leading-5',
        tone === 'info' && 'border border-line bg-surface-2 text-ink-2',
        tone === 'limit' && 'border border-dashed border-line-strong text-ink-2',
        tone === 'warn' &&
          'border border-[color-mix(in_oklab,var(--warn)_35%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] text-ink-2',
        className,
      )}
    >
      {title && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}
