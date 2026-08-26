import { apiFetch } from '@/lib/api/client';
import type { Schema } from '@/lib/api/types';
import type { Advice } from './squad.api';

export type PlayerList = Schema<'PlayerListDto'>;
export type PlayerListItem = Schema<'PlayerListItemDto'>;
export type SquadValidation = Schema<'SquadValidationDto'>;

/** Every player, fetched on the server and handed to the builder as a prop. */
export async function getPlayers(): Promise<PlayerList> {
  return apiFetch<PlayerList>('/players', { cache: 'no-store' });
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

export async function adviseBuiltSquad(playerIds: string[]): Promise<Advice> {
  return apiFetch<Advice>('/insights/advice', {
    method: 'POST',
    body: { playerIds },
  });
}
