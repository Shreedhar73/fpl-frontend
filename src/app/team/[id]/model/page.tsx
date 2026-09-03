import type { Metadata } from 'next';
import { ModelTab } from '@/features/board/components/model-tab';
import { BoardPage, boardMetadata } from '@/features/board/page';

export async function generateMetadata({ params }: PageProps<'/team/[id]/model'>): Promise<Metadata> {
  return boardMetadata(params, 'Model');
}

export default function ModelPage({ params, searchParams }: PageProps<'/team/[id]/model'>) {
  return (
    <BoardPage params={params} searchParams={searchParams} active="model">
      {(team) => <ModelTab team={team} />}
    </BoardPage>
  );
}
