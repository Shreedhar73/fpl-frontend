'use client';

import type { ReactNode } from 'react';
import { cx } from '@/lib/format';
import { usePlayerSheetOptional } from './player-sheet-context';

/**
 * The tap target. A `<button>` around whatever markup the server component already renders —
 * a shirt, a name, a move — so the pitch and the tables stay server-rendered and only this leaf
 * ships as JavaScript.
 *
 * Outside a provider it renders its children unwrapped, so a component reused on a page without
 * a sheet loses the tap and nothing else.
 */
export function PlayerTrigger({
  playerId,
  name,
  children,
  className,
  block = false,
}: {
  playerId: string;
  /** For the accessible name: "Open Haaland". */
  name: string;
  children: ReactNode;
  className?: string;
  /** Fill the parent (the shirt) rather than sit inline (a name in a table). */
  block?: boolean;
}) {
  const sheet = usePlayerSheetOptional();
  if (!sheet) return <>{children}</>;

  return (
    <button
      type="button"
      onClick={() => sheet.open(playerId)}
      aria-label={`Open ${name}`}
      aria-haspopup="dialog"
      className={cx(
        'cursor-pointer text-left transition-[transform,opacity] active:scale-[0.98]',
        block ? 'block' : 'inline-flex items-center',
        className,
      )}
    >
      {children}
    </button>
  );
}
