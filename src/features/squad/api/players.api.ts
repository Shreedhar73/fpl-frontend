import { apiFetch, apiFetchWithMeta, type WithMeta } from '@/lib/api/client';
import type { Schema } from '@/lib/api/types';
import type { Advice } from './squad.api';

export type PlayerList = Schema<'PlayerListDto'>;
export type PlayerListItem = Schema<'PlayerListItemDto'>;
export type SquadValidation = Schema<'SquadValidationDto'>;
export type PlayerDetail = Schema<'PlayerDetailDto'>;
export type PlayerProjection = Schema<'PlayerProjectionDto'>;
export type PlayerFixture = Schema<'PlayerFixtureDto'>;
export type PlayerRecentGameweek = Schema<'PlayerRecentGameweekDto'>;

/** Every player, fetched on the server and handed to the builder as a prop. */
export async function getPlayers(): Promise<WithMeta<PlayerList>> {
  return apiFetchWithMeta<PlayerList>('/players', { cache: 'no-store' });
}

/**
 * One player, whole — the payload behind the player sheet (plan 030). Called from the browser on
 * a tap, never on a page render: it is the one fetch in the app that a reader asks for rather than
 * arrives at, and it carries model output, so the sheet renders its `meta`.
 */
export async function getPlayerDetail(
  playerId: string,
): Promise<WithMeta<PlayerDetail>> {
  return apiFetchWithMeta<PlayerDetail>(
    `/players/${encodeURIComponent(playerId)}`,
    { cache: 'no-store' },
  );
}

/**
 * The two calls the builder makes from the browser. They go through `apiFetch` like everything
 * else, so the envelope unwrap and the error normalisation are the same on both sides.
 */
export async function validateSquad(
  playerIds: string[],
): Promise<SquadValidation> {
  return apiFetch<SquadValidation>('/squad/validate', {
    method: 'POST',
    body: { playerIds },
  });
}

export async function adviseBuiltSquad(
  playerIds: string[],
): Promise<WithMeta<Advice>> {
  return apiFetchWithMeta<Advice>('/insights/advice', {
    method: 'POST',
    body: { playerIds },
  });
}
