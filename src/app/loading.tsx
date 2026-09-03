/**
 * What every route shows while its server component fetches. The squad page makes three backend
 * calls and the builder pulls 651 players, so this is on screen often enough to matter — and a
 * skeleton the shape of the page beats a spinner that says nothing about what is coming.
 *
 * No animation beyond a pulse, and the pulse is disabled under `prefers-reduced-motion` by the
 * rule in globals.css.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <div className="animate-pulse">
        <div className="h-3 w-40 rounded bg-surface-3" />
        <div className="mt-2 h-8 w-64 rounded-lg bg-surface-3" />
        <div className="mt-2 h-3 w-80 rounded bg-surface-2" />
        <div className="mt-4 flex gap-2">
          <div className="h-7 w-20 rounded-full bg-surface-2" />
          <div className="h-7 w-24 rounded-full bg-surface-2" />
          <div className="h-7 w-24 rounded-full bg-surface-2" />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="h-[26rem] rounded-2xl bg-surface-3" />
          <div className="flex flex-col gap-3">
            <div className="h-40 rounded-2xl bg-surface-3" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-24 rounded-2xl bg-surface-2" />
              <div className="h-24 rounded-2xl bg-surface-2" />
              <div className="h-24 rounded-2xl bg-surface-2" />
              <div className="h-24 rounded-2xl bg-surface-2" />
            </div>
          </div>
        </div>

        <div className="mt-5 h-44 rounded-2xl bg-surface-2" />
      </div>
      <p className="sr-only" role="status">
        Loading
      </p>
    </main>
  );
}
