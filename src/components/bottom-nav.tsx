'use client';

import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { cx } from '@/lib/format';

/**
 * The phone's navigation, fixed to the bottom edge and hidden from `md` up. On a team route it is
 * the board's four tabs plus a way to another team; elsewhere it is the three ways in.
 */
export function BottomNav() {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const onTeam = id !== undefined && pathname.startsWith('/team/');
  // A hand-built team lives in its query string; the tabs must carry it.
  const search = useSearchParams().toString();
  const q = search ? `?${search}` : '';

  const items: { href: string; label: string; icon: ReactNode; active: boolean }[] = onTeam
    ? [
        { href: `/team/${id}${q}`, label: 'Week', icon: <HomeIcon />, active: pathname === `/team/${id}` },
        { href: `/team/${id}/plan${q}`, label: 'Plan', icon: <CalIcon />, active: pathname.endsWith('/plan') },
        { href: `/team/${id}/squad${q}`, label: 'Squad', icon: <GridIcon />, active: pathname.endsWith('/squad') },
        { href: `/team/${id}/model${q}`, label: 'Model', icon: <BrainIcon />, active: pathname.endsWith('/model') },
        { href: '/', label: 'Teams', icon: <ShirtIcon />, active: false },
      ]
    : [
        { href: '/', label: 'Teams', icon: <ShirtIcon />, active: pathname === '/' },
        { href: '/team/recommended', label: "Model's 15", icon: <StarIcon />, active: false },
        { href: '/build', label: 'Build', icon: <GridIcon />, active: pathname === '/build' },
      ];

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((it) => (
          <li key={it.label} className="flex-1">
            <Link
              href={it.href}
              aria-current={it.active ? 'page' : undefined}
              className={cx(
                'flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors',
                it.active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
              )}
            >
              <span className={cx('grid h-6 w-10 place-items-center rounded-full transition-colors', it.active && 'bg-surface-3')}>
                {it.icon}
              </span>
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const svg = {
  viewBox: '0 0 24 24',
  className: 'size-[18px]',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function HomeIcon() {
  return (
    <svg aria-hidden {...svg}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg aria-hidden {...svg}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg aria-hidden {...svg}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M4 15h16M10 4v16" />
    </svg>
  );
}
function BrainIcon() {
  return (
    <svg aria-hidden {...svg}>
      <path d="M12 4a4 4 0 0 0-4 4v1a4 4 0 0 0-2 7 4 4 0 0 0 6 3 4 4 0 0 0 6-3 4 4 0 0 0-2-7V8a4 4 0 0 0-4-4Z" />
      <path d="M12 4v16" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg aria-hidden {...svg}>
      <path d="m12 3 2.8 5.9 6.2.8-4.5 4.4 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.7l6.2-.8Z" />
    </svg>
  );
}
function ShirtIcon() {
  return (
    <svg aria-hidden {...svg}>
      <path d="M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3a4 4 0 0 1-8 0Z" />
    </svg>
  );
}
