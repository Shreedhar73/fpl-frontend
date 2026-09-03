'use client';

import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

/**
 * The last net: an error React could not attribute to a page's own handler. Every fetch in this app
 * is already caught where it is made and rendered through `ErrorState`, so anything reaching here
 * is a render fault rather than a backend one — and it says so, instead of blaming the API.
 *
 * Required to be a client component by React's error-boundary contract.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          This page could not be rendered
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-2">
          Something failed while building the view. The data may be fine — trying
          again is worth one attempt before anything else.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-ink-3">
            reference {error.digest}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className={buttonClass({ size: 'sm' })}>
            Try again
          </button>
          <Link href="/" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            Start again
          </Link>
        </div>
      </div>
    </main>
  );
}
