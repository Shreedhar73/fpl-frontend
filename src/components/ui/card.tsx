import type { ReactNode } from 'react';
import { cx } from '@/lib/format';

/**
 * The one surface in the app. Everything that sits on the canvas sits in one of these, so there is
 * a single place to change how a raised thing looks.
 */
export function Card({
  children,
  className,
  as: Tag = 'div',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
  padded?: boolean;
}) {
  return (
    <Tag
      className={cx(
        'rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]',
        padded && 'p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** A heading with an optional right-hand slot — used at the top of every card and section. */
export function SectionHeading({
  title,
  subtitle,
  aside,
  level = 2,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  level?: 2 | 3;
}) {
  const Tag = level === 2 ? 'h2' : 'h3';
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
      <div>
        <Tag
          className={cx(
            'font-semibold tracking-tight text-ink',
            level === 2 ? 'text-base' : 'text-sm',
          )}
        >
          {title}
        </Tag>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-5 text-ink-3">{subtitle}</p>
        )}
      </div>
      {aside && <div className="shrink-0 text-xs text-ink-3">{aside}</div>}
    </div>
  );
}
