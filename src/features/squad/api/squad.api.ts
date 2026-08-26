import { apiFetch, ApiError } from '@/lib/api/client';
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

/** A squad's picks are meaningless out of slot order — the bench order is inside them. */
function inSlotOrder(squad: Squad): Squad {
  return { ...squad, picks: [...squad.picks].sort((a, b) => a.slot - b.slot) };
}

export async function importSquad(managerId: number): Promise<Squad> {
  const squad = await apiFetch<Squad>('/squad/import', {
    method: 'POST',
    body: { managerId },
    cache: 'no-store',
  });
  return inSlotOrder(squad);
}

export async function getSquad(managerId: number): Promise<Squad> {
  return inSlotOrder(
    await apiFetch<Squad>(`/squad/${managerId}`, { cache: 'no-store' }),
  );
}

export async function getRecommendedSquad(): Promise<Squad> {
  return inSlotOrder(
    await apiFetch<Squad>('/squad/recommended', { cache: 'no-store' }),
  );
}

export async function getAdvice(managerId: number): Promise<Advice> {
  return apiFetch<Advice>(`/insights/advice/${managerId}`, {
    cache: 'no-store',
  });
}

export async function getRecommendedAdvice(): Promise<Advice> {
  return apiFetch<Advice>('/insights/advice/recommended', {
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
    return (
      ERROR_MESSAGES[err.errorCode ?? ''] ??
      err.message ??
      'Something went wrong.'
    );
  }
  // A fetch that never reached the backend at all — it is not running, or the URL is wrong.
  return 'Could not reach the backend. Is it running on :5001?';
}

/** Tenths of a million to the way FPL writes money. Formatting happens only here, at the edge. */
export function money(tenths: number): string {
  return `£${(tenths / 10).toFixed(1)}m`;
}
