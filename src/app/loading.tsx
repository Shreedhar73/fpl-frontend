/**
 * What every route shows while its server component fetches. The squad page makes two backend
 * calls and the builder pulls 614 players, so this is on screen often enough to matter — and a
 * skeleton the shape of the page beats a spinner that says nothing about what is coming.
 *
 * No animation beyond a pulse, and the pulse is disabled under `prefers-reduced-motion` by the
 * rule in globals.css.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <div className="animate-pulse">
        <div className="h-7 w-56 rounded-lg bg-surface-3" />
        <div className="mt-2 h-3 w-72 rounded bg-surface-2" />

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="h-80 rounded-xl bg-surface-3" />
          <div className="flex flex-col gap-3">
            <div className="h-28 rounded-xl bg-surface-3" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-20 rounded-xl bg-surface-2" />
              <div className="h-20 rounded-xl bg-surface-2" />
              <div className="h-20 rounded-xl bg-surface-2" />
              <div className="h-20 rounded-xl bg-surface-2" />
            </div>
          </div>
        </div>

        <div className="mt-5 h-44 rounded-xl bg-surface-2" />
      </div>
      <p className="sr-only" role="status">
        Loading
      </p>
    </main>
  );
}
