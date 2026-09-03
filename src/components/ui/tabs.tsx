import Link from 'next/link';
import { cx } from '@/lib/format';

export interface TabItem {
  href: string;
  label: string;
  key: string;
}

/**
 * Route tabs. Plain links, server-rendered, `aria-current` on the active one: a tab is a URL a
 * reader can share, not a state a page holds.
 */
export function Tabs({
  items,
  active,
  className,
}: {
  items: TabItem[];
  active: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Sections"
      className={cx(
        'inline-flex items-center gap-1 rounded-[11px] border border-line bg-surface p-[3px]',
        className,
      )}
    >
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === active ? 'page' : undefined}
          className={cx(
            'inline-flex h-9 items-center rounded-lg px-3.5 text-[13px] font-semibold transition-colors',
            t.key === active ? 'bg-surface-3 text-ink' : 'text-ink-3 hover:text-ink',
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
