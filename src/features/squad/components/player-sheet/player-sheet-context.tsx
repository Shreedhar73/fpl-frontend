'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { WithMeta } from '@/lib/api/client';
import { getPlayerDetail, type PlayerDetail } from '../../api/players.api';
import { messageFor } from '../../api/squad.api';
import { PlayerSheet } from './player-sheet';

/**
 * One sheet per page, opened from anywhere on it. The provider owns which player is open, a
 * per-page cache of what has already been fetched — a reader who taps the same shirt twice
 * should not pay twice — and the fetch state the sheet renders.
 *
 * Mounted once by the squad view and once by the builder. Server components underneath reach it
 * through `<PlayerTrigger>`, a client leaf that takes their markup as children; nothing else on
 * the page joins the bundle for it.
 */

export type SheetState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; detail: PlayerDetail; meta: WithMeta<PlayerDetail>['meta'] };

interface PlayerSheetApi {
  open: (playerId: string) => void;
  close: () => void;
  retry: () => void;
  openId: string | null;
  state: SheetState | null;
}

const Ctx = createContext<PlayerSheetApi | null>(null);

export function PlayerSheetProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [state, setState] = useState<SheetState | null>(null);
  const cache = useRef(new Map<string, WithMeta<PlayerDetail>>());
  // Which request is current, so a slow response for a player closed in the meantime is dropped
  // rather than painted over whoever was opened next.
  const seq = useRef(0);

  const load = useCallback(async (playerId: string) => {
    const hit = cache.current.get(playerId);
    if (hit) {
      setState({ status: 'ready', detail: hit.data, meta: hit.meta });
      return;
    }
    const mine = ++seq.current;
    setState({ status: 'loading' });
    try {
      const result = await getPlayerDetail(playerId);
      cache.current.set(playerId, result);
      if (seq.current === mine)
        setState({ status: 'ready', detail: result.data, meta: result.meta });
    } catch (err) {
      if (seq.current === mine)
        setState({ status: 'error', message: messageFor(err) });
    }
  }, []);

  const open = useCallback(
    (playerId: string) => {
      setOpenId(playerId);
      void load(playerId);
    },
    [load],
  );

  const close = useCallback(() => {
    seq.current++;
    setOpenId(null);
    setState(null);
  }, []);

  const retry = useCallback(() => {
    if (openId) void load(openId);
  }, [openId, load]);

  const api = useMemo(
    () => ({ open, close, retry, openId, state }),
    [open, close, retry, openId, state],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <PlayerSheet />
    </Ctx.Provider>
  );
}

export function usePlayerSheet(): PlayerSheetApi {
  const api = useContext(Ctx);
  if (!api)
    throw new Error('usePlayerSheet must be used inside <PlayerSheetProvider>');
  return api;
}

/** Null outside a provider, so a trigger rendered somewhere without a sheet degrades to plain markup. */
export function usePlayerSheetOptional(): PlayerSheetApi | null {
  return useContext(Ctx);
}
