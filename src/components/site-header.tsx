import Link from 'next/link';
import { NavLink } from './nav-link';
import { ThemeToggle } from './theme-toggle';

/**
 * One shell for every route. The team-id field lives here as well as on the landing page: it is
 * the app's main verb, and needing it means going home first is the kind of small tax that gets
 * paid on every visit. Plain GET form, no JavaScript — `/squad` turns `?managerId=7` into `/squad/7`.
 *
 * Below `md` the primary links move to the bottom navigation and the header keeps the mark, the
 * field and the theme toggle.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-ink"
        >
          <PitchMark />
          <span className="hidden sm:inline">
            FPL <span className="text-ink-3">Advisor</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <NavLink href="/squad/recommended">Recommended</NavLink>
          <NavLink href="/squad/build">Build</NavLink>
        </nav>

        <form
          action="/squad"
          method="get"
          className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:flex-none"
        >
          <label htmlFor="header-manager-id" className="sr-only">
            FPL team id
          </label>
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <SearchIcon />
            <input
              id="header-manager-id"
              name="managerId"
              type="number"
              min={1}
              required
              inputMode="numeric"
              placeholder="Team id"
              className="h-9 w-full rounded-full border border-line bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-3 sm:w-36"
            />
          </div>
          <button
            type="submit"
            className="h-9 shrink-0 rounded-full bg-accent px-3.5 text-xs font-semibold text-accent-ink transition-opacity hover:opacity-90"
          >
            Advise
          </button>
        </form>

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

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}
