'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { fullTimestamp, localTimestamp, utcTimestamp } from '@/lib/format';

/**
 * The one thing on a server-rendered page that cannot be right on the server: the reader's time
 * zone. The HTML ships the instant in UTC — correct for everyone, and what a reader with no
 * JavaScript keeps — and this swaps in their own zone once hydrated.
 *
 * `useSyncExternalStore` rather than an effect: it takes a server snapshot and a client snapshot
 * as first-class arguments, which is exactly the shape of the problem, and it avoids the cascading
 * render an effect-then-setState causes.
 *
 * A client component, so it is a leaf on purpose: put it anywhere higher and the tree beneath it
 * joins the bundle.
 */

/** The zone does not change mid-session, so there is nothing to subscribe to. */
const noSubscribe = () => () => {};

export function LocalTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    noSubscribe,
    useCallback(() => localTimestamp(iso), [iso]),
    useCallback(() => utcTimestamp(iso), [iso]),
  );

  return (
    <time dateTime={iso} title={fullTimestamp(iso)} className="tabular-nums">
      {text}
    </time>
  );
}
