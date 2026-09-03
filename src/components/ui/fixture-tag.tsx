import { cx } from '@/lib/format';

/**
 * One fixture as a tag: the opponent, H or A, and FPL's difficulty as a tone. The opponent and
 * the venue are always printed — the tone is a reading aid, and colour alone signals nothing here
 * (the same rule as the position hues in `badge.tsx`).
 */
export function difficultyClass(difficulty: number): string {
  if (difficulty <= 2) return 'bg-[color-mix(in_oklab,var(--diff-easy)_16%,transparent)] text-diff-easy';
  if (difficulty === 3) return 'bg-surface-3 text-ink-2';
  if (difficulty === 4) return 'bg-[color-mix(in_oklab,var(--diff-hard)_18%,transparent)] text-diff-hard';
  return 'bg-[color-mix(in_oklab,var(--diff-hardest)_18%,transparent)] text-diff-hardest';
}

export function FixtureTag({
  opponent,
  isHome,
  difficulty,
  size = 'md',
  className,
}: {
  opponent: string;
  isHome: boolean;
  difficulty: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      title={`${isHome ? 'Home to' : 'Away at'} ${opponent} · difficulty ${difficulty} of 5`}
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md font-semibold',
        size === 'sm' ? 'h-[17px] px-1 text-[10px]' : 'h-5 px-1.5 text-[11px]',
        difficultyClass(difficulty),
        className,
      )}
    >
      <span className="font-bold">{opponent}</span>
      <span className="opacity-80">{isHome ? 'H' : 'A'}</span>
    </span>
  );
}

/** A gameweek with no fixture, printed rather than left as a gap. */
export function BlankTag({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      title="No fixture this gameweek"
      className={cx(
        'inline-flex items-center whitespace-nowrap rounded-md border border-dashed border-line-strong font-medium text-ink-3',
        size === 'sm' ? 'h-[17px] px-1 text-[10px]' : 'h-5 px-1.5 text-[11px]',
        className,
      )}
    >
      blank
    </span>
  );
}
