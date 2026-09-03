'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Eyebrow } from './why';

/**
 * The stepper for a hand-built 15, whose free-transfer count nothing can check. It writes `ft`
 * into the URL, so the plan re-solves on the server and the link stays shareable.
 */
export function FreeTransfers({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const set = (n: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set('ft', String(n));
    router.replace(`${pathname}?${next.toString()}`);
  };
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>Free transfers</Eyebrow>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => set(Math.max(0, current - 1))} disabled={current <= 0} aria-label="One fewer free transfer" className="grid size-8 place-items-center rounded-lg border border-line-strong text-ink-2 hover:bg-surface-2 disabled:opacity-40">−</button>
        <span className="num w-6 text-center text-xl font-extrabold text-ink">{current}</span>
        <button type="button" onClick={() => set(Math.min(5, current + 1))} disabled={current >= 5} aria-label="One more free transfer" className="grid size-8 place-items-center rounded-lg border border-line-strong text-ink-2 hover:bg-surface-2 disabled:opacity-40">+</button>
        <span className="text-xs text-ink-3">as you state it — the plan re-solves with the number</span>
      </div>
    </div>
  );
}
