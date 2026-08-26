/**
 * Where the numbers come from, on every page. The app has no account and stores no identity, and
 * saying so once at the bottom is cheaper than explaining it per screen.
 */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs leading-5 text-ink-3 sm:px-6">
        <p>
          Built on the public Fantasy Premier League API. No account, no login,
          nothing stored about you — a team id is a public number, not an
          identity.
        </p>
        <p className="mt-1">
          Projections are this app&apos;s own model, not FPL&apos;s. Every number
          on screen carries the gameweek it was computed from; where the model
          cannot know something, the page says so instead of guessing.
        </p>
      </div>
    </footer>
  );
}
