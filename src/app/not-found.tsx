import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

/**
 * Reached mainly by `/squad/<something that is not a number>`, so the copy is about team ids rather
 * than about pages.
 */
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Nothing here
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-ink-2">
          A team id is a whole number — the one in your team&apos;s URL on the
          official site, fantasy.premierleague.com/entry/
          <strong className="font-semibold text-ink">1234567</strong>/event/1.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/#team-id" className={buttonClass({ size: 'sm' })}>
            Enter a team id
          </Link>
          <Link
            href="/squad/recommended"
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            See the recommended squad
          </Link>
        </div>
      </div>
    </main>
  );
}
