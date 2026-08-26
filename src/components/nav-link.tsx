'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cx } from '@/lib/format';

/**
 * A nav item that knows whether it is the page you are on. The only reason this is a client
 * component is `usePathname`, so it stays a leaf: the header around it is server-rendered.
 */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'rounded-lg px-2.5 py-1.5 text-sm transition-colors',
        active
          ? 'bg-surface-3 font-medium text-ink'
          : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
      )}
    >
      {children}
    </Link>
  );
}
