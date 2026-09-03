import type { Metadata } from 'next';
import { PlanTab } from '@/features/board/components/plan-tab';
import { BoardPage, boardMetadata } from '@/features/board/page';

export async function generateMetadata({ params }: PageProps<'/team/[id]/plan'>): Promise<Metadata> {
  return boardMetadata(params, 'Plan');
}

export default function PlanPage({ params, searchParams }: PageProps<'/team/[id]/plan'>) {
  return (
    <BoardPage params={params} searchParams={searchParams} active="plan">
      {(team) => <PlanTab team={team} />}
    </BoardPage>
  );
}
