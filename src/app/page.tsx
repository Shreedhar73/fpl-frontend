import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Note } from '@/components/ui/note';

/**
 * The three ways a team reaches the model (decision D-013). None of them is a login: the manager
 * id is a public number typed into a form, and nothing about it is stored as an identity.
 *
 * A server component with a plain GET form — no `'use client'`, no JavaScript. The form navigates
 * to /squad?managerId=…, which redirects to the squad page.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-3">
          Fantasy Premier League
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Every pick, with the reasoning shown
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-2 sm:text-base">
          Projected points per player per gameweek, the best legal 15 under the
          full ruleset, and the captain and bench order that follow from them —
          each with the terms it was built from. No account, no login: everything
          here comes from the public FPL API.
        </p>
      </header>

      <Card className="border-line-strong">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">
              Bring your own team
            </h2>
            <p className="mt-1 max-w-md text-xs leading-5 text-ink-2">
              Your team id is the number in your team&apos;s URL on the official
              site — fantasy.premierleague.com/entry/
              <strong className="font-semibold text-ink">1234567</strong>
              /event/1
            </p>
          </div>

          <form action="/squad" method="get" className="flex flex-wrap gap-2">
            <label htmlFor="managerId" className="sr-only">
              FPL team id
            </label>
            <input
              id="managerId"
              name="managerId"
              type="number"
              min={1}
              required
              placeholder="1234567"
              inputMode="numeric"
              className="w-44 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3"
            />
            <button type="submit" className={buttonClass()}>
              Get advice
            </button>
          </form>
        </div>

        <Note className="mt-4" tone="info">
          What comes back is your last locked squad. A team you have edited but
          not yet had a deadline on is private to FPL, and this app never asks
          for a password to see it.
        </Note>
      </Card>

      <section aria-label="Other ways in" className="grid gap-3 sm:grid-cols-2">
        <EntryCard
          href="/squad/recommended"
          title="Start from the recommended team"
          body="The best legal 15 the optimizer can build from scratch: £100.0m, 2/5/5/3, a valid formation, at most 3 per club."
        />
        <EntryCard
          href="/squad/build"
          title="Build a team by hand"
          body="Pick 15 yourself under the live rules, with the projection for each player next to their price and the budget checked as you go."
        />
      </section>

      <section aria-label="What the model gives you" className="grid gap-3 sm:grid-cols-3">
        <Explainer
          title="A captain call you can argue with"
          body="The armband goes to the largest projection in your squad, and the page shows the minutes, the play probability and the terms behind it."
        />
        <Explainer
          title="The gap to the best 15"
          body="Your squad against the optimal one over the whole horizon, with the players each has that the other does not."
        />
        <Explainer
          title="What it will not tell you"
          body="Every view carries the gameweek its numbers came from and the list of questions the model does not answer. An honest gap beats a confident guess."
        />
      </section>
    </main>
  );
}

function EntryCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      <h2 className="flex items-center gap-1 text-sm font-semibold text-ink">
        {title}
        <span
          aria-hidden
          className="text-ink-3 transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </h2>
      <p className="mt-1 text-xs leading-5 text-ink-2">{body}</p>
    </Link>
  );
}

function Explainer({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <h3 className="text-xs font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-ink-2">{body}</p>
    </div>
  );
}
