/** The board's shape while a page fetches: head, the three calls, the pitch and the panel. */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 sm:px-10">
      <div className="animate-pulse">
        <div className="h-3 w-48 rounded bg-surface-3" />
        <div className="mt-2 h-8 w-64 rounded-lg bg-surface-3" />
        <div className="mt-2 h-3 w-80 rounded bg-surface-2" />
        <div className="mt-6 grid gap-6 border-y border-line py-5 md:grid-cols-3">
          <div className="h-24 rounded-lg bg-surface-2" />
          <div className="h-24 rounded-lg bg-surface-2" />
          <div className="h-24 rounded-lg bg-surface-2" />
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,760px)_minmax(0,1fr)]">
          <div className="h-[30rem] rounded-[14px] bg-surface-3" />
          <div className="flex flex-col gap-4">
            <div className="h-28 rounded-lg bg-surface-2" />
            <div className="h-20 rounded-lg bg-surface-2" />
            <div className="h-40 rounded-lg bg-surface-2" />
          </div>
        </div>
      </div>
      <p className="sr-only" role="status">Loading</p>
    </main>
  );
}
