import type { Metadata } from 'next';
import { getPlayers, type PlayerList } from '@/features/squad/api/players.api';
import { ErrorState } from '@/features/squad/components/error-state';
import { SquadBuilder } from '@/features/squad/components/squad-builder';
import type { ApiResponseMeta } from '@/lib/api/types';

export const metadata: Metadata = {
  title: 'Build a squad',
  description:
    'Pick 15 players under the live FPL rules, with this app’s projection beside every price.',
};

/**
 * The manual builder. The page is a server component and fetches the player universe once on the
 * server; only the picker itself is a client component, because selection state is the one thing
 * here that genuinely lives in the browser.
 */
export default async function BuildSquadPage() {
  let list: PlayerList;
  let meta: ApiResponseMeta | null;
  try {
    const result = await getPlayers();
    list = result.data;
    meta = result.meta;
  } catch (err) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <ErrorState error={err} title="Could not load the player list" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <SquadBuilder
        players={list.players}
        meta={meta}
        gameweekId={list.gameweekId}
        modelVersion={list.modelVersion}
      />
    </main>
  );
}
