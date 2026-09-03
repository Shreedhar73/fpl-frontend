import Link from 'next/link';
import { RecentTeamRows } from '@/components/recent-teams';

/**
 * The entry: one field, the teams this browser remembers, the two other ways in. Nothing to sell —
 * a visitor who is here has a team id and wants the board. Server component, plain GET form; the
 * `/squad` route turns `?managerId=…` into `/team/…`.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center gap-9 px-4 pb-20 pt-14 sm:px-10">
      <div className="flex max-w-[560px] flex-col items-center gap-2.5 text-center">
        <h1 className="num text-[38px] font-extrabold leading-[1.05] text-ink sm:text-[44px]">Which team?</h1>
        <p className="text-[15px] leading-6 text-ink-2">
          The number in your team&apos;s URL on the official site. Public data only, so no login and
          nothing to store.
        </p>
      </div>

      <form action="/squad" method="get" className="flex w-full max-w-[560px] gap-2.5">
        <label htmlFor="managerId" className="sr-only">FPL team id</label>
        <div className="flex h-14 min-w-0 flex-1 items-center gap-2.5 rounded-[14px] border border-line-strong bg-surface px-4">
          <svg aria-hidden viewBox="0 0 24 24" className="size-[18px] shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></svg>
          <input
            id="managerId"
            name="managerId"
            type="number"
            min={1}
            required
            placeholder="1234567"
            inputMode="numeric"
            className="num h-full min-w-0 flex-1 bg-transparent text-lg text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </div>
        <button type="submit" className="num h-14 shrink-0 rounded-[14px] bg-accent px-6 text-[15px] font-bold text-accent-ink hover:opacity-90">
          Open
        </button>
      </form>

      <RecentTeamRows className="w-full max-w-[560px]" />

      <div className="flex w-full max-w-[560px] flex-wrap gap-7 text-[13.5px] font-semibold">
        <Link href="/team/recommended" className="inline-flex items-center gap-1.5 text-ink hover:underline underline-offset-4">
          The model&apos;s own 15 <Arrow />
        </Link>
        <Link href="/build" className="inline-flex items-center gap-1.5 text-ink hover:underline underline-offset-4">
          Build one by hand <Arrow />
        </Link>
      </div>
      <p className="max-w-[560px] text-center text-xs leading-5 text-ink-3">
        What comes back is your last locked squad. A team you have edited but not yet had a deadline
        on is private to FPL, and this app never asks for a password to see it.
      </p>
    </main>
  );
}

function Arrow() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  );
}
