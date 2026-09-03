import { cache } from 'react';
import { apiFetch } from '@/lib/api/client';
import type { Schema } from '@/lib/api/types';

export type NextGameweek = Schema<'NextGameweekDto'>;

/**
 * The gameweek a decision can still be made for, with its deadline (plan 032). Read by the
 * header on every route and by the board, so it is memoised per request with React's `cache`:
 * one call however many server components ask.
 *
 * Null rather than a throw when the backend has no upcoming gameweek or is down: a header with
 * no deadline is still a header, and the board says what the absence means.
 */
export const getNextGameweek = cache(async (): Promise<NextGameweek | null> => {
  try {
    return await apiFetch<NextGameweek>('/gameweeks/next', { cache: 'no-store' });
  } catch {
    return null;
  }
});
