import type { Metadata } from 'next';
import { HorizonLedger } from '@/features/board/components/horizon-ledger';
import { BoardPage, boardMetadata } from '@/features/board/page';

export async function generateMetadata({ params }: PageProps<'/team/[id]/squad'>): Promise<Metadata> {
  return boardMetadata(params, 'Squad');
}

export default function SquadPage({ params, searchParams }: PageProps<'/team/[id]/squad'>) {
  return (
    <BoardPage params={params} searchParams={searchParams} active="squad">
      {(team) => <HorizonLedger team={team} />}
    </BoardPage>
  );
}
