import Link from 'next/link';

/**
 * The three ways a team reaches the model (decision D-013). None of them is a login: the manager
 * id is a public number typed into a form, and nothing about it is stored as an identity.
 *
 * A server component with a plain GET form — no `'use client'`, no JavaScript. The form navigates
 * to /squad?managerId=…, which redirects to the squad page.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Fantasy Premier League, with the reasoning shown
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Projections per player per gameweek, the best legal 15 under the full
          ruleset, and the captain and bench order that follow from them. No
          account, no login — everything here comes from the public FPL API.
        </p>
      </header>

      <section className="rounded-lg bg-zinc-50 p-5 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Bring your own team
        </h2>
        <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
          Your team id is the number in your team&apos;s URL on the official site:
          fantasy.premierleague.com/entry/<strong>1234567</strong>/event/1
        </p>
        <form action="/squad" method="get" className="mt-3 flex flex-wrap gap-2">
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
            className="w-48 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Get advice
          </button>
        </form>
        <p className="mt-2 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
          What comes back is your last locked squad. A team you have edited but not
          yet had a deadline on is private to FPL, and this app never asks for a
          password to see it.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/squad/recommended"
          className="rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Start from the recommended team →
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
            The best legal 15 the optimizer can build from scratch: £100.0m,
            2/5/5/3, a valid formation, at most 3 per club.
          </p>
        </Link>

        <Link
          href="/squad/build"
          className="rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Build a team by hand →
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
            Pick 15 yourself under the live rules, with the projection for each
            player next to their price.
          </p>
        </Link>
      </section>
    </main>
  );
}
