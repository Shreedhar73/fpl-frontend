import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

/** Reached mainly by `/team/<something that is not a team>`, so the copy is about team ids. */
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-16 sm:px-10">
      <div className="max-w-xl">
        <h1 className="num text-2xl font-extrabold text-ink">Nothing here</h1>
        <p className="mt-2 text-sm leading-6 text-ink-2">
          A team id is a whole number — the one in your team&apos;s URL on the official site,
          fantasy.premierleague.com/entry/<strong className="font-semibold text-ink">1234567</strong>/event/1.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/" className={buttonClass({ size: 'sm' })}>Enter a team id</Link>
          <Link href="/team/recommended" className={buttonClass({ variant: 'secondary', size: 'sm' })}>The model&apos;s 15</Link>
        </div>
      </div>
    </main>
  );
}
