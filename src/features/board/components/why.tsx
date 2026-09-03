import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from '@/lib/format';

/** The dashed "Why" / "Plan" / "Model" link every call carries: the case is one tap away. */
export function Why({ href, children = 'Why', className }: { href: string; children?: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cx(
        'border-b border-dashed border-line-strong pb-px text-xs font-semibold text-ink-3 hover:border-ink hover:text-ink',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3', className)}>
      {children}
    </span>
  );
}
