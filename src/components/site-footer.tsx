/** Where the numbers come from, once, at the bottom. */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line">
      <p className="mx-auto w-full max-w-[1440px] px-4 py-5 text-[11.5px] leading-5 text-ink-3 sm:px-10">
        Built on the public Fantasy Premier League API. No account, no login, nothing stored about
        you beyond what your own browser remembers. Projections are this app&apos;s own model, not
        FPL&apos;s; where the model cannot know something, the page says so.
      </p>
    </footer>
  );
}
