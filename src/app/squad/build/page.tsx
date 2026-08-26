import { getPlayers, type PlayerList } from '@/features/squad/api/players.api';
import { ErrorState } from '@/features/squad/components/error-state';
import { SquadBuilder } from '@/features/squad/components/squad-builder';

/**
 * The manual builder. The page is a server component and fetches the player universe once on the
 * server; only the picker itself is a client component, because selection state is the one thing
 * here that genuinely lives in the browser.
 */
export default async function BuildSquadPage() {
  let list: PlayerList;
  try {
    list = await getPlayers();
  } catch (err) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <ErrorState error={err} title="Could not load the player list" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <SquadBuilder players={list.players} />
    </main>
  );
}
