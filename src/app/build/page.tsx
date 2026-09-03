import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getPlayers, type PlayerList } from '@/features/squad/api/players.api';
import { SquadBuilder } from '@/features/build/components/squad-builder';
import { ErrorState } from '@/features/squad/components/error-state';
import type { ApiResponseMeta } from '@/lib/api/types';

export const metadata: Metadata = {
  title: 'Build a squad',
  description: 'Pick 15 players under the live FPL rules, pitch first, with this app’s projection beside every price.',
};

/**
 * The builder. The page fetches the player universe once on the server; the picker is the one
 * genuinely interactive view in the app. The picked ids live in the URL, so "Advise this 15" is a
 * navigation to `/team/built?ids=…` and a half-built squad survives a reload.
 */
export default async function BuildPage() {
  let list: PlayerList;
  let meta: ApiResponseMeta | null;
  try {
    const result = await getPlayers();
    list = result.data;
    meta = result.meta;
  } catch (err) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-10">
        <ErrorState error={err} title="Could not load the player list" />
      </main>
    );
  }
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 pt-6 sm:px-10">
      <Suspense fallback={null}>
        <SquadBuilder list={list} meta={meta} />
      </Suspense>
    </main>
  );
}
