import Link from 'next/link';
import { RecentTeams } from '@/components/recent-teams';
import { buttonClass } from '@/components/ui/button';
import { Note } from '@/components/ui/note';

/**
 * The three ways a team reaches the model (decision D-013). None of them is a login: the manager
 * id is a public number typed into a form, and nothing about it is stored as an identity.
 *
 * A server component with a plain GET form — no `'use client'`, no JavaScript beyond the leaf that
 * lists the teams this browser has already looked at. The form navigates to /squad?managerId=…,
 * which redirects to the squad page.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16">
      <section className="flex flex-col gap-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-3">
            Fantasy Premier League
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            Every pick, with the reasoning shown.
          </h1>
          <p className="mt-4 text-sm leading-6 text-ink-2 sm:text-base sm:leading-7">
            Projected points for every player, the best legal 15 under the full
            ruleset, the captain and the transfers that follow — and behind
            every name, the case for it. No account, no login: everything comes
            from the public FPL API.
          </p>
        </div>

        <div
          id="team-id"
          className="scroll-mt-24 rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-raised)] sm:p-6"
        >
          <form action="/squad" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="managerId" className="text-sm font-semibold text-ink">
                Your FPL team id
              </label>
              <p className="mt-0.5 text-xs leading-5 text-ink-3">
                The number in your team&apos;s URL on the official site —
                fantasy.premierleague.com/entry/
                <strong className="font-semibold text-ink-2">1234567</strong>
                /event/1
              </p>
              <input
                id="managerId"
                name="managerId"
                type="number"
                min={1}
                required
                placeholder="1234567"
                inputMode="numeric"
                className="mt-2 h-12 w-full rounded-full border border-line-strong bg-surface px-5 text-base text-ink placeholder:text-ink-3"
              />
            </div>
            <button type="submit" className={buttonClass({ size: 'lg', className: 'sm:w-auto' })}>
              Get advice
            </button>
          </form>

          <RecentTeams className="mt-4" />

          <Note className="mt-4" tone="info">
            What comes back is your last locked squad. A team you have edited but
            not yet had a deadline on is private to FPL, and this app never asks
            for a password to see it.
          </Note>
        </div>
      </section>

      <section aria-label="Other ways in" className="grid gap-3 sm:grid-cols-2">
        <EntryCard
          href="/squad/recommended"
          eyebrow="Start from the model"
          title="The recommended 15"
          body="The best legal squad the optimizer can build from scratch: £100.0m, 2/5/5/3, a valid formation, at most three per club."
        />
        <EntryCard
          href="/squad/build"
          eyebrow="Start from you"
          title="Build a team by hand"
          body="Pick 15 under the live rules, with the projection for each player next to their price and the budget checked as you go."
        />
      </section>

      <section aria-label="How it works" className="grid gap-3 sm:grid-cols-3">
        <Step
          n={1}
          title="A projection per player, per gameweek"
          body="Expected minutes times per-90 rates times the fixture, with the terms kept so every number can be argued with."
        />
        <Step
          n={2}
          title="The best legal 15, solved"
          body="Budget, quotas, the three-per-club limit, formation and captaincy as one problem, over the next five gameweeks."
        />
        <Step
          n={3}
          title="Then what to do about yours"
          body="Captain, bench order, the gap to the best 15, and transfers priced at what selling actually returns."
        />
      </section>
    </main>
  );
}

function EntryCard({
  href,
  eyebrow,
  title,
  body,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-raised)]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">{eyebrow}</p>
      <h2 className="mt-1 flex items-center gap-1.5 text-base font-semibold text-ink">
        {title}
        <span aria-hidden className="text-ink-3 transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </h2>
      <p className="mt-1.5 text-xs leading-5 text-ink-2">{body}</p>
    </Link>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-line bg-surface-2 p-5">
      <span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">
        {n}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-ink-2">{body}</p>
    </div>
  );
}
