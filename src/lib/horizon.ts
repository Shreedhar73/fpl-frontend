import type { BoardPlayer } from '@/features/board/load-team';

/**
 * Arithmetic over the advice payload that the board needs and the contract does not carry —
 * all of it from `epNextGw`, `horizon[]`, `role` and the pick's `slot`, so a number here and the
 * matching one in `comparison` are summed from the same rows.
 */

export type Position = BoardPlayer['position'];

const MIN: Record<Position, number> = { GKP: 1, DEF: 3, MID: 2, FWD: 1 };
const MAX: Record<Position, number> = { GKP: 1, DEF: 5, MID: 5, FWD: 3 };
const ORDER: Position[] = ['GKP', 'DEF', 'MID', 'FWD'];

export const positionOrder = (p: Position): number => ORDER.indexOf(p);

/** The eleven as the manager locked them: slots 1–11. */
export function pickedXi(players: BoardPlayer[]): BoardPlayer[] {
  return players.filter((p) => p.slot <= 11);
}

/** The eleven the model would field from the same 15. */
export function modelXi(players: BoardPlayer[]): BoardPlayer[] {
  return players.filter((p) => p.role !== 'bench');
}

/**
 * Next-gameweek points of the picked XI with the picked armband doubled — the same arithmetic
 * `comparison.xiNextGwEp` applies to the model's arrangement, so the two are comparable.
 */
export function pickedXiEp(players: BoardPlayer[]): number {
  return pickedXi(players).reduce(
    (s, p) => s + p.epNextGw * (p.isCaptain ? 2 : 1),
    0,
  );
}

/** Whether the picks ARE the model's arrangement — true for the recommended and a built 15. */
export function picksAreModels(players: BoardPlayer[]): boolean {
  return players.every((p) => (p.slot <= 11) === (p.role !== 'bench'));
}

export interface LineupSwap {
  out: BoardPlayer;
  in: BoardPlayer;
  gain: number;
}

/**
 * The lineup-only changes: who the model would start that the picks bench, paired with who it
 * would bench that the picks start. Paired by position where possible so the sentence reads as
 * the swap a manager would actually make; the gain is the pair's difference.
 */
export function lineupSwaps(players: BoardPlayer[]): LineupSwap[] {
  const ins = players.filter((p) => p.slot > 11 && p.role !== 'bench');
  const outs = players.filter((p) => p.slot <= 11 && p.role === 'bench');
  const swaps: LineupSwap[] = [];
  const left = [...outs];
  for (const i of ins) {
    let idx = left.findIndex((o) => o.position === i.position);
    if (idx === -1) idx = 0;
    const o = left[idx];
    if (!o) break;
    left.splice(idx, 1);
    swaps.push({ out: o, in: i, gain: i.epNextGw - o.epNextGw });
  }
  return swaps;
}

/** The model's bench order beside the picked one. Both are lists of ids, bench 1 first. */
export function benchOrders(players: BoardPlayer[]): { picked: string[]; model: string[] } {
  const picked = players
    .filter((p) => p.slot > 11)
    .sort((a, b) => a.slot - b.slot)
    .map((p) => p.playerId);
  const model = players
    .filter((p) => p.role === 'bench')
    .sort((a, b) => (a.benchOrder ?? 9) - (b.benchOrder ?? 9))
    .map((p) => p.playerId);
  return { picked, model };
}

export interface GwTotal {
  gameweekId: number;
  /** The best legal XI's points, no captain. Null when no player has a row for the gameweek. */
  total: number | null;
  /** How many of the 15 had no projection for the gameweek — stated, not hidden. */
  missing: number;
}

/**
 * The best legal XI from these 15 for one horizon gameweek, greedy: fill each position's minimum
 * with its best, then the rest of the eleven from whoever is best that still fits under the
 * maxima. Not the optimizer — that has the concentration charge in it — but the same shape the
 * ledger's totals row promises: "best XI each week, before captaincy".
 */
export function bestXiForGameweek(players: BoardPlayer[], gameweekId: number): GwTotal {
  const rows = players.map((p) => ({
    p,
    ep: p.horizon.find((h) => h.gameweekId === gameweekId)?.expectedPoints ?? null,
  }));
  const missing = rows.filter((r) => r.ep === null).length;
  if (missing === rows.length) return { gameweekId, total: null, missing };

  const byPos = (pos: Position) =>
    rows.filter((r) => r.p.position === pos).sort((a, b) => (b.ep ?? 0) - (a.ep ?? 0));
  const chosen = new Set<string>();
  const count: Record<Position, number> = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
  let total = 0;
  for (const pos of ORDER) {
    for (const r of byPos(pos).slice(0, MIN[pos])) {
      chosen.add(r.p.playerId);
      count[pos]++;
      total += r.ep ?? 0;
    }
  }
  const rest = rows
    .filter((r) => !chosen.has(r.p.playerId))
    .sort((a, b) => (b.ep ?? 0) - (a.ep ?? 0));
  for (const r of rest) {
    if (chosen.size >= 11) break;
    if (count[r.p.position] >= MAX[r.p.position]) continue;
    chosen.add(r.p.playerId);
    count[r.p.position]++;
    total += r.ep ?? 0;
  }
  return { gameweekId, total: Math.round(total * 10) / 10, missing };
}

export function bestXiTotals(players: BoardPlayer[], gameweekIds: number[]): GwTotal[] {
  return gameweekIds.map((gw) => bestXiForGameweek(players, gw));
}

/** A player's undecayed horizon sum from the advice rows; null when every cell is null. */
export function horizonSum(p: BoardPlayer): number | null {
  const cells = p.horizon.map((h) => h.expectedPoints).filter((x): x is number => x !== null);
  if (cells.length === 0) return null;
  return Math.round(cells.reduce((s, x) => s + x, 0) * 10) / 10;
}
