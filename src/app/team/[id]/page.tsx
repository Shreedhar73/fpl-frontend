import type { Metadata } from 'next';
import { Bench, BoardPitch } from '@/features/board/components/board-pitch';
import { Calls } from '@/features/board/components/calls';
import { LineupPanel } from '@/features/board/components/lineup-panel';
import { WontTell } from '@/features/board/components/wont-tell';
import { BoardPage, boardMetadata } from '@/features/board/page';

export async function generateMetadata({ params }: PageProps<'/team/[id]'>): Promise<Metadata> {
  return boardMetadata(params, 'Week');
}

/** The Week: the three calls, the pitch, the lineup, and what the model will not tell you. */
export default function WeekPage({ params, searchParams }: PageProps<'/team/[id]'>) {
  return (
    <BoardPage params={params} searchParams={searchParams} active="week">
      {(team) => (
        <>
          <Calls team={team} />
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,760px)_minmax(0,1fr)] lg:gap-10">
            <div className="flex flex-col gap-5">
              <BoardPitch team={team} />
              <Bench team={team} />
            </div>
            <LineupPanel team={team} />
          </div>
          <WontTell team={team} />
        </>
      )}
    </BoardPage>
  );
}
