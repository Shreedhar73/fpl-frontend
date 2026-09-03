'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore, type ReactNode } from 'react';
import { cx } from '@/lib/format';
import {
  getRecentTeams,
  getServerRecentTeams,
  subscribeRecentTeams,
} from '@/lib/recent-teams';

/**
 * The phone's navigation: four thumb-sized targets fixed to the bottom edge, hidden from `md` up
 * where the header carries the same links. "My team" appears once this browser has looked at one;
 * until then the slot is the landing page's form.
 */
export function BottomNav() {
  const pathname = usePathname();
  const recent = useSyncExternalStore(
    subscribeRecentTeams,
    getRecentTeams,
    getServerRecentTeams,
  );
  const mine = recent[0];

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        <Item href="/" active={pathname === '/'} label="Home" icon={<HomeIcon />} />
        <Item
          href="/squad/recommended"
          active={pathname.startsWith('/squad/recommended')}
          label="Recommended"
          icon={<StarIcon />}
        />
        <Item
          href="/squad/build"
          active={pathname.startsWith('/squad/build')}
          label="Build"
          icon={<GridIcon />}
        />
        <Item
          href={mine ? `/squad/${mine.id}` : '/#team-id'}
          active={mine !== undefined && pathname === `/squad/${mine.id}`}
          label="My team"
          icon={<ShirtIcon />}
        />
      </ul>
    </nav>
  );
}

function Item({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cx(
          'flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
          active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
        )}
      >
        <span
          className={cx(
            'grid h-6 w-10 place-items-center rounded-full transition-colors',
            active && 'bg-surface-3',
          )}
        >
          {icon}
        </span>
        {label}
      </Link>
    </li>
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

function StarIcon() {
  return (
    <svg aria-hidden {...svg}>
      <path d="m12 3 2.8 5.9 6.2.8-4.5 4.4 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.7l6.2-.8Z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden {...svg}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <path d="M16.5 13.5v6M13.5 16.5h6" />
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
