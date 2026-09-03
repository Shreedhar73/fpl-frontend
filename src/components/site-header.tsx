import Link from 'next/link';
import { getNextGameweek } from '@/features/gameweek/api/gameweek.api';
import { TeamSwitcher } from './team-switcher';
import { ThemeToggle } from './theme-toggle';
import { Deadline } from './ui/deadline';

/**
 * One shell for every route: the mark, the team switcher, the deadline, the theme. No id field —
 * the entry page has the one field, and the switcher remembers what this browser has looked at.
 * Server-rendered; the deadline's countdown and the switcher are the only client leaves.
 */
export async function SiteHeader() {
  const next = await getNextGameweek();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-3 px-4 sm:gap-5 sm:px-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
        >
          <PitchMark />
          <span className="hidden sm:inline">
            FPL <span className="text-ink-3">Advisor</span>
          </span>
        </Link>

        <TeamSwitcher />

        <div className="flex-1" />

        {next && (
          <>
            <Deadline
              gameweekId={next.id}
              deadlineTime={next.deadlineTime}
              className="hidden md:inline-flex"
            />
            <Deadline
              gameweekId={next.id}
              deadlineTime={next.deadlineTime}
              compact
              className="inline-flex md:hidden"
            />
          </>
        )}

        <ThemeToggle className="shrink-0" />
      </div>
    </header>
  );
}

/** The mark: a mown pitch and a centre spot. Drawn, so it costs no request and no image asset. */
function PitchMark() {
  return (
    <span
      aria-hidden
      className="pitch relative grid size-7 place-items-center overflow-hidden rounded-lg shadow-[var(--shadow-card)]"
    >
      <span className="block size-2.5 rounded-full border border-white/70" />
      <span className="absolute inset-x-1 top-1/2 block h-px bg-white/40" />
    </span>
  );
}
