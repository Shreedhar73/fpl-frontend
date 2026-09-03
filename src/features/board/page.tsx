import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Provenance } from '@/components/ui/provenance';
import { BoardError } from './components/board-error';
import { BoardHead, type BoardTab } from './components/board-head';
import { loadTeam, resolveSource, type TeamData } from './load-team';

type SearchParams = Promise<{ ids?: string; ft?: string; player?: string; vs?: string }>;

/**
 * The frame every tab page renders through: load (memoised with the layout's call), head, the tab's
 * own content, provenance. A page passes a render function so the content sees the loaded team.
 */
export async function BoardPage({
  params,
  searchParams,
  active,
  children,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
  active: BoardTab;
  children: (team: TeamData) => ReactNode;
}) {
  const { id } = await params;
  const sp = await searchParams;
  // Not a team — a junk segment, or `built` with no ids — is the not-found page, before any fetch.
  if (resolveSource(id, { ids: sp.ids, ft: sp.ft }) === null) notFound();
  let team: TeamData;
  try {
    team = await loadTeam(id, id === 'built' ? sp.ids : undefined, id === 'built' ? sp.ft : undefined);
  } catch (err) {
    return <BoardError error={err} id={id} />;
  }
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 pt-6 sm:px-10">
      <BoardHead team={team} active={active} />
      {children(team)}
      <Provenance
        className="pb-4"
        meta={team.meta}
        modelVersion={team.advice.modelVersion}
        gameweekId={team.advice.gameweekId}
      />
    </main>
  );
}

export async function boardMetadata(params: Promise<{ id: string }>, tab: string) {
  const { id } = await params;
  const who = id === 'recommended' ? "The model's 15" : id === 'built' ? 'Hand-built 15' : /^\d+$/.test(id) ? `Team ${id}` : 'Team';
  return { title: `${who} · ${tab}` };
}
