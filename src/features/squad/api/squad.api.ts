import { apiFetchWithMeta, ApiError, type WithMeta } from '@/lib/api/client';
import type { Schema } from '@/lib/api/types';

/**
 * Typed calls into the backend's squad and insights endpoints. No React here — these are plain
 * functions a server component awaits (fpl-architecture-contract §4).
 *
 * Every shape is generated from the backend's OpenAPI document. Nothing on this page is
 * hand-written, so a backend contract change becomes a type error at `pnpm generate:api` rather
 * than an `undefined` at runtime.
 */

export type Squad = Schema<'SquadDto'>;
export type SquadPick = Schema<'SquadPickDto'>;
export type Advice = Schema<'AdviceDto'>;
export type AdvicePlayer = Schema<'AdvicePlayerDto'>;
export type Comparison = Schema<'ComparisonDto'>;
export type SquadDifference = Schema<'SquadDifferenceDto'>;
export type TransferPlan = Schema<'TransferPlanDto'>;
export type PlannedMove = Schema<'PlannedMoveDto'>;
export type ChipAdvice = Schema<'ChipAdviceDto'>;

/**
 * These return the envelope's `meta` alongside the data, and the views render it. Every number in
 * this app is derived, and `meta.dataAsOfGw` is the only thing that says which gameweek's data
 * derived it — the frontend contract requires it on screen wherever model output is.
 */

/** A squad's picks are meaningless out of slot order — the bench order is inside them. */
function inSlotOrder({ data, meta }: WithMeta<Squad>): WithMeta<Squad> {
  return {
    data: { ...data, picks: [...data.picks].sort((a, b) => a.slot - b.slot) },
    meta,
  };
}

export async function importSquad(managerId: number): Promise<WithMeta<Squad>> {
  return inSlotOrder(
    await apiFetchWithMeta<Squad>('/squad/import', {
      method: 'POST',
      body: { managerId },
      cache: 'no-store',
    }),
  );
}

export async function getSquad(managerId: number): Promise<WithMeta<Squad>> {
  return inSlotOrder(
    await apiFetchWithMeta<Squad>(`/squad/${managerId}`, { cache: 'no-store' }),
  );
}

export async function getRecommendedSquad(): Promise<WithMeta<Squad>> {
  return inSlotOrder(
    await apiFetchWithMeta<Squad>('/squad/recommended', { cache: 'no-store' }),
  );
}

export async function getAdvice(managerId: number): Promise<WithMeta<Advice>> {
  return apiFetchWithMeta<Advice>(`/insights/advice/${managerId}`, {
    cache: 'no-store',
  });
}

/**
 * The transfer plan (B-008).
 *
 * A separate call from the advice, because it is a separate call on the backend: it makes two
 * on-demand reads against FPL and a second ILP solve, and the recommended-squad page — which has no
 * manager and therefore no transfers — must not pay for it.
 */
export async function getTransferPlan(
  managerId: number,
): Promise<WithMeta<TransferPlan>> {
  return apiFetchWithMeta<TransferPlan>(`/insights/transfers/${managerId}`, {
    cache: 'no-store',
  });
}

export async function getRecommendedAdvice(): Promise<WithMeta<Advice>> {
  return apiFetchWithMeta<Advice>('/insights/advice/recommended', {
    cache: 'no-store',
  });
}

/**
 * The backend's stable error keys. Switching on these rather than on message text is the whole
 * point of the envelope carrying an `errorCode`.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  MANAGER_NOT_FOUND:
    "There's no FPL team with that id. It's the number in your team's URL on the official site — fantasy.premierleague.com/entry/1234567/event/1.",
  SQUAD_NOT_IMPORTED: "That team hasn't been imported yet.",
  SQUAD_NOT_AVAILABLE_YET:
    "That team exists, but its picks aren't public yet. FPL only reveals a squad once the gameweek's deadline has passed.",
  FPL_UPSTREAM_UNAVAILABLE:
    "The official FPL API didn't answer. Nothing is wrong with your team id — try again in a moment.",
  UNKNOWN_PLAYER:
    'That squad contains a player this app has never synced. The data needs refreshing before it can advise on it.',
  BAD_RESPONSE: 'The backend returned something unreadable.',
};

export function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    const known = ERROR_MESSAGES[err.errorCode ?? ''];
    if (known) return known;
    // A 400 with no error code is a DTO validator talking, and it names the field rather than the
    // thing the reader typed — "managerId must not be greater than 100000000". Say it in their
    // terms and keep the original as the detail.
    if (err.statusCode === 400) {
      return `That is not a team id FPL uses — it is the number in your team's URL on the official site. (${err.message})`;
    }
    return err.message ?? 'Something went wrong.';
  }
  // A fetch that never reached the backend at all — it is not running, or the URL is wrong.
  return 'Could not reach the backend. Is it running on :5001?';
}

/** Tenths of a million to the way FPL writes money. Formatting happens only here, at the edge. */
export function money(tenths: number): string {
  return `£${(tenths / 10).toFixed(1)}m`;
}
