'use client';

import { useState, type ReactNode } from 'react';
import { cx } from '@/lib/format';

/**
 * Gameweek or the next five: both pitches arrive server-rendered as children; this leaf only
 * picks which one is shown. Nothing about a player crosses into the bundle for it.
 */
export function PitchMode({
  gwLabel,
  legend,
  gw,
  horizon,
}: {
  gwLabel: string;
  legend?: ReactNode;
  gw: ReactNode;
  horizon: ReactNode;
}) {
  const [mode, setMode] = useState<'gw' | 'horizon'>('gw');
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div role="tablist" aria-label="Pitch view" className="inline-flex items-center gap-[3px] rounded-[9px] border border-line bg-surface p-[3px]">
          {(['gw', 'horizon'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cx(
                'h-7 rounded-md px-3 text-xs font-semibold transition-colors',
                mode === m ? 'bg-surface-3 text-ink' : 'text-ink-3 hover:text-ink',
              )}
            >
              {m === 'gw' ? gwLabel : 'Next five'}
            </button>
          ))}
        </div>
        {legend}
      </div>
      <div hidden={mode !== 'gw'}>{gw}</div>
      <div hidden={mode !== 'horizon'}>{horizon}</div>
    </>
  );
}
