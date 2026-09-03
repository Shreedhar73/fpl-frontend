import { RememberTeam } from '@/components/recent-teams';
import { BoardError } from '@/features/board/components/board-error';
import { loadTeam, type TeamData } from '@/features/board/load-team';

/**
 * Everything the four tabs share: the load (memoised, so the page underneath pays nothing extra),
 * the remembered-team write, and the error. The head with the tabs is rendered by each page, so
 * the active tab is known without a client hook.
 */
export default async function TeamLayout({
  children,
  params,
}: LayoutProps<'/team/[id]'>) {
  const { id } = await params;
  let team: TeamData;
  try {
    // The query is read by the page (layouts do not receive searchParams); the loader keys on it.
    team = await loadTeam(id, undefined, undefined);
  } catch (err) {
    if (id !== 'built') return <BoardError error={err} id={id} />;
    // A built team's ids live in the query, which this layout cannot read — the page handles it.
    return <>{children}</>;
  }
  return (
    <>
      {team.source.kind === 'manager' && (
        <RememberTeam id={team.source.id} name={team.squad.managerName} />
      )}
      {children}
    </>
  );
}
