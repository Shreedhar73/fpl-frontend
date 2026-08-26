import Link from 'next/link';
import { buttonClass } from './ui/button';
import { NavLink } from './nav-link';

/**
 * One shell for every route. Before B-009 each page began at its own `<h1>` with no way to reach
 * the others — the app had three entry points and no navigation between them.
 *
 * The team-id field lives here as well as on the landing page: it is the app's main verb, and
 * needing it means going home first is the kind of small tax that gets paid on every visit. Plain
 * GET form, no JavaScript — `/squad` turns `?managerId=7` into `/squad/7`.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink"
        >
          <PitchMark />
          <span>
            FPL <span className="text-ink-3">Advisor</span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          <NavLink href="/squad/recommended">Recommended</NavLink>
          <NavLink href="/squad/build">Build</NavLink>
        </nav>

        <form
          action="/squad"
          method="get"
          className="ml-auto flex items-center gap-1.5"
        >
          <label htmlFor="header-manager-id" className="sr-only">
            FPL team id
          </label>
          <input
            id="header-manager-id"
            name="managerId"
            type="number"
            min={1}
            required
            inputMode="numeric"
            placeholder="Team id"
            className="w-28 rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-3 sm:w-32"
          />
          <button type="submit" className={buttonClass({ size: 'sm' })}>
            Advise
          </button>
        </form>
      </div>
    </header>
  );
}

/** The mark: a mown pitch and a centre spot. Drawn, so it costs no request and no image asset. */
function PitchMark() {
  return (
    <span
      aria-hidden
      className="pitch relative grid size-6 place-items-center overflow-hidden rounded-md"
    >
      <span className="block size-2 rounded-full border border-white/70" />
      <span className="absolute inset-x-1 top-1/2 block h-px bg-white/40" />
    </span>
  );
}
