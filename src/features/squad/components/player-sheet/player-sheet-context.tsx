'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
 * One rail per app, opened from anywhere. The provider owns which player is open, which one is
 * beside it for a comparison, a per-session cache so a shirt tapped twice is fetched once, and
 * the fetch state the rail renders.
 *
 * The open pair is mirrored into the URL (`?player=…&vs=…`) with `replaceState`, so a board link
 * can arrive with a player open and a reload keeps it — without a navigation, so the server
 * component tree above is never re-rendered for it.
 */

export type SheetState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; detail: PlayerDetail; meta: WithMeta<PlayerDetail>['meta'] };

interface PlayerSheetApi {
  open: (playerId: string) => void;
  /** Two players side by side — the captain against the vice, the out against the in. */
  compare: (playerId: string, vsId: string) => void;
  /** The next `open` lands in the compare column instead of replacing the primary. */
  armCompare: () => void;
  clearCompare: () => void;
  close: () => void;
  retry: () => void;
  openId: string | null;
  vsId: string | null;
  armed: boolean;
  state: SheetState | null;
  vsState: SheetState | null;
}

const Ctx = createContext<PlayerSheetApi | null>(null);
const ID = /^[a-z0-9]{10,40}$/i;

function readUrl(): { player: string | null; vs: string | null } {
  try {
    const sp = new URLSearchParams(window.location.search);
    const p = sp.get('player');
    const v = sp.get('vs');
    return { player: p && ID.test(p) ? p : null, vs: v && ID.test(v) ? v : null };
  } catch {
    return { player: null, vs: null };
  }
}

function writeUrl(player: string | null, vs: string | null): void {
  try {
    const url = new URL(window.location.href);
    if (player) url.searchParams.set('player', player);
    else url.searchParams.delete('player');
    if (player && vs) url.searchParams.set('vs', vs);
    else url.searchParams.delete('vs');
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {
    // No history API, or a sandboxed frame: the rail still opens, the link just does not carry it.
  }
}

export function PlayerSheetProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [vsId, setVsId] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [state, setState] = useState<SheetState | null>(null);
  const [vsState, setVsState] = useState<SheetState | null>(null);
  const cache = useRef(new Map<string, WithMeta<PlayerDetail>>());
  // Which request is current per column, so a slow response for a player closed in the meantime
  // is dropped rather than painted over whoever was opened next.
  const seq = useRef({ primary: 0, vs: 0 });

  const load = useCallback(async (playerId: string, column: 'primary' | 'vs') => {
    const set = column === 'primary' ? setState : setVsState;
    const hit = cache.current.get(playerId);
    if (hit) {
      set({ status: 'ready', detail: hit.data, meta: hit.meta });
      return;
    }
    const mine = ++seq.current[column];
    set({ status: 'loading' });
    try {
      const result = await getPlayerDetail(playerId);
      cache.current.set(playerId, result);
      if (seq.current[column] === mine) set({ status: 'ready', detail: result.data, meta: result.meta });
    } catch (err) {
      if (seq.current[column] === mine) set({ status: 'error', message: messageFor(err) });
    }
  }, []);

  const open = useCallback(
    (playerId: string) => {
      setArmed((wasArmed) => {
        if (wasArmed && openId && playerId !== openId) {
          setVsId(playerId);
          writeUrl(openId, playerId);
          void load(playerId, 'vs');
        } else {
          setOpenId(playerId);
          writeUrl(playerId, vsId);
          void load(playerId, 'primary');
        }
        return false;
      });
    },
    [load, openId, vsId],
  );

  const compare = useCallback(
    (playerId: string, vs: string) => {
      setArmed(false);
      setOpenId(playerId);
      setVsId(vs);
      writeUrl(playerId, vs);
      void load(playerId, 'primary');
      void load(vs, 'vs');
    },
    [load],
  );

  const armCompare = useCallback(() => setArmed(true), []);

  const clearCompare = useCallback(() => {
    seq.current.vs++;
    setVsId(null);
    setVsState(null);
    setArmed(false);
    writeUrl(openId, null);
  }, [openId]);

  const close = useCallback(() => {
    seq.current.primary++;
    seq.current.vs++;
    setOpenId(null);
    setVsId(null);
    setArmed(false);
    setState(null);
    setVsState(null);
    writeUrl(null, null);
  }, []);

  const retry = useCallback(() => {
    if (openId) void load(openId, 'primary');
    if (vsId) void load(vsId, 'vs');
  }, [openId, vsId, load]);

  // A link that arrives with a player in it opens the rail once, after hydration. Deferred a tick
  // so the first client render matches the server's (rail closed) and the open is a real update.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const { player, vs } = readUrl();
      if (player && vs) compare(player, vs);
      else if (player) open(player);
    }, 0);
    return () => window.clearTimeout(t);
    // Once, on mount: the URL is the input, not a subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api = useMemo(
    () => ({ open, compare, armCompare, clearCompare, close, retry, openId, vsId, armed, state, vsState }),
    [open, compare, armCompare, clearCompare, close, retry, openId, vsId, armed, state, vsState],
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
  if (!api) throw new Error('usePlayerSheet must be used inside <PlayerSheetProvider>');
  return api;
}

/** Null outside a provider, so a trigger rendered somewhere without a rail degrades to plain markup. */
export function usePlayerSheetOptional(): PlayerSheetApi | null {
  return useContext(Ctx);
}
