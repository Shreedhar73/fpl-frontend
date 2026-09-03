import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { messageFor } from '../api/squad.api';

/**
 * Every backend `errorCode` reaches the user as a sentence they can act on, and every failure ends
 * with somewhere to go. Nothing here renders a raw error string: the backend's message is a
 * fallback, not the plan.
 */
export function ErrorState({
  error,
  title = 'That did not work',
}: {
  error: unknown;
  title?: string;
}) {
  return (
    <div className="rounded-3xl border border-[color-mix(in_oklab,var(--warn)_40%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-xl text-sm leading-6 text-ink-2">
        {messageFor(error)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/" className={buttonClass({ size: 'sm' })}>
          Start again
        </Link>
        <Link
          href="/squad/recommended"
          className={buttonClass({ variant: 'secondary', size: 'sm' })}
        >
          See the recommended squad
        </Link>
      </div>
    </div>
  );
}
