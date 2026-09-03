import { cache } from 'react';
import { getNextGameweek, type NextGameweek } from '@/features/gameweek/api/gameweek.api';
import {
  adviseBuiltSquad,
  planBuiltTransfers,
} from '@/features/squad/api/players.api';
import {
  getAdvice,
  getRecommendedAdvice,
  getRecommendedSquad,
  getTransferPlan,
  importSquad,
  messageFor,
  type Advice,
  type AdvicePlayer,
  type Squad,
  type TransferPlan,
} from '@/features/squad/api/squad.api';
import type { ApiResponseMeta } from '@/lib/api/types';

/**
 * One loader for the three ways a team reaches the board (D-013: none of them a login). Memoised
 * per request with React's `cache`, so the team layout and the tab page underneath it share one
 * set of fetches however many components ask.
 */

export type TeamSource =
  | { kind: 'manager'; id: number }
  | { kind: 'recommended' }
  | { kind: 'built'; ids: string[]; freeTransfers: number };

/** A pick and its advice, joined — what every board component reads. */
export interface BoardPlayer extends AdvicePlayer {
  slot: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  sellValue: number | null;
}

export interface TeamData {
  source: TeamSource;
  squad: Squad;
  advice: Advice;
  meta: ApiResponseMeta | null;
  players: BoardPlayer[];
  /** Null on the recommended 15 (nobody's, nothing to plan from) and when the plan call failed. */
  plan: TransferPlan | null;
  planError: string | null;
  next: NextGameweek | null;
  /** `/team/7912139`, `/team/recommended`, `/team/built` — the tabs hang off it. */
  basePath: string;
  /** The query a built team carries, `?ids=…&ft=…`; empty otherwise. */
  query: string;
}

export class TeamLoadError extends Error {
  constructor(
    readonly stage: 'squad' | 'advice',
    readonly cause: unknown,
  ) {
    super(messageFor(cause));
    this.name = 'TeamLoadError';
  }
}

export function resolveSource(
  id: string,
  sp: { ids?: string; ft?: string },
): TeamSource | null {
  if (id === 'recommended') return { kind: 'recommended' };
  if (id === 'built') {
    const ids = (sp.ids ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^[a-z0-9]{10,40}$/i.test(s));
    if (ids.length === 0) return null;
    const ft = Number(sp.ft ?? 1);
    return {
      kind: 'built',
      ids: [...new Set(ids)],
      freeTransfers: Number.isInteger(ft) && ft >= 0 && ft <= 5 ? ft : 1,
    };
  }
  const n = Number(id);
  if (!/^\d+$/.test(id) || !Number.isInteger(n) || n < 1) return null;
  return { kind: 'manager', id: n };
}

const POSITION_ORDER = { GKP: 0, DEF: 1, MID: 2, FWD: 3 } as const;

/**
 * A squad for a hand-built 15, which the backend does not persist: the model's arrangement IS the
 * picks. Bank is what £100.0m leaves at today's prices, which is what the plan endpoint assumes.
 */
function builtSquad(advice: Advice): Squad {
  const xi = advice.players
    .filter((p) => p.role !== 'bench')
    .sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position]);
  const bench = advice.players
    .filter((p) => p.role === 'bench')
    .sort((a, b) => (a.benchOrder ?? 9) - (b.benchOrder ?? 9));
  const picks = [...xi, ...bench].map((p, i) => ({
    playerId: p.playerId,
    fplId: p.fplId,
    webName: p.webName,
    position: p.position,
    teamShortName: p.teamShortName,
    nowCost: p.nowCost,
    sellValue: null,
    slot: i + 1,
    multiplier: p.role === 'captain' ? 2 : 1,
    isCaptain: p.role === 'captain',
    isViceCaptain: p.role === 'vice',
  }));
  const teamValue = picks.reduce((s, p) => s + p.nowCost, 0);
  return {
    managerId: null,
    managerName: null,
    gameweekId: advice.gameweekId,
    bank: Math.max(0, 1000 - teamValue),
    teamValue,
    activeChip: null,
    source: 'built',
    picks,
  };
}

function join(squad: Squad, advice: Advice): BoardPlayer[] {
  const picks = new Map(squad.picks.map((p) => [p.playerId, p]));
  return advice.players
    .map((p) => {
      const pick = picks.get(p.playerId);
      return {
        ...p,
        slot: pick?.slot ?? (p.role === 'bench' ? 11 + (p.benchOrder ?? 4) : 1),
        isCaptain: pick?.isCaptain ?? false,
        isViceCaptain: pick?.isViceCaptain ?? false,
        sellValue: pick?.sellValue ?? null,
      };
    })
    .sort((a, b) => a.slot - b.slot);
}

async function load(id: string, ids: string | undefined, ft: string | undefined): Promise<TeamData> {
  const source = resolveSource(id, { ids, ft });
  if (!source) throw new TeamLoadError('squad', new Error('Not a team'));
  const next = getNextGameweek();

  if (source.kind === 'manager') {
    let squad: Squad;
    try {
      squad = (await importSquad(source.id)).data;
    } catch (err) {
      throw new TeamLoadError('squad', err);
    }
    let advice: Advice;
    let meta: ApiResponseMeta | null;
    try {
      const r = await getAdvice(source.id);
      advice = r.data;
      meta = r.meta;
    } catch (err) {
      throw new TeamLoadError('advice', err);
    }
    // The plan is a second solve and two on-demand reads against FPL: the piece most likely to be
    // slow or absent, and a board with its advice is still a board without it.
    let plan: TransferPlan | null = null;
    let planError: string | null = null;
    try {
      plan = (await getTransferPlan(source.id)).data;
    } catch (err) {
      planError = messageFor(err);
    }
    return {
      source,
      squad,
      advice,
      meta,
      players: join(squad, advice),
      plan,
      planError,
      next: await next,
      basePath: `/team/${source.id}`,
      query: '',
    };
  }

  if (source.kind === 'recommended') {
    let squad: Squad;
    let advice: Advice;
    let meta: ApiResponseMeta | null;
    try {
      const [s, a] = await Promise.all([getRecommendedSquad(), getRecommendedAdvice()]);
      squad = s.data;
      advice = a.data;
      meta = a.meta;
    } catch (err) {
      throw new TeamLoadError('squad', err);
    }
    return {
      source,
      squad,
      advice,
      meta,
      players: join(squad, advice),
      plan: null,
      planError: null,
      next: await next,
      basePath: '/team/recommended',
      query: '',
    };
  }

  let advice: Advice;
  let meta: ApiResponseMeta | null;
  try {
    const r = await adviseBuiltSquad(source.ids);
    advice = r.data;
    meta = r.meta;
  } catch (err) {
    throw new TeamLoadError('advice', err);
  }
  const squad = builtSquad(advice);
  let plan: TransferPlan | null = null;
  let planError: string | null = null;
  try {
    plan = (await planBuiltTransfers(source.ids, source.freeTransfers)).data;
  } catch (err) {
    planError = messageFor(err);
  }
  const query = `?ids=${source.ids.join(',')}&ft=${source.freeTransfers}`;
  return {
    source,
    squad,
    advice,
    meta,
    players: join(squad, advice),
    plan,
    planError,
    next: await next,
    basePath: '/team/built',
    query,
  };
}

export const loadTeam = cache(load);

export function teamTitle(t: TeamData): string {
  if (t.source.kind === 'recommended') return "The model's 15";
  if (t.source.kind === 'built') return 'Hand-built 15';
  return t.squad.managerName ?? `Team ${t.source.id}`;
}
