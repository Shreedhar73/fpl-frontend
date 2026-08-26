import Link from 'next/link';
import { messageFor } from '../api/squad.api';

/**
 * Every backend `errorCode` reaches the user as a sentence they can act on. Nothing here renders a
 * raw error string: the backend's message is a fallback, not the plan.
 */
export function ErrorState({
  error,
  title = 'That did not work',
}: {
  error: unknown;
  title?: string;
}) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-amber-900/90 dark:text-amber-200/90">
        {messageFor(error)}
      </p>
      <Link
        href="/"
        className="mt-3 inline-block text-xs font-medium text-amber-900 underline dark:text-amber-200"
      >
        Start again
      </Link>
    </div>
  );
}
