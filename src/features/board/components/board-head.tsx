import { Tabs } from '@/components/ui/tabs';
import { money } from '@/lib/format';
import { teamTitle, type TeamData } from '../load-team';

export type BoardTab = 'week' | 'plan' | 'squad' | 'model';

/**
 * The board's head: who this is, the money, the free transfers, and the four tabs. The heading is
 * the manager's name when the import carried one — the switcher remembers it for next time.
 */
export function BoardHead({ team, active }: { team: TeamData; active: BoardTab }) {
  const { squad, plan, source } = team;
  const eyebrow =
    source.kind === 'recommended'
      ? `Optimizer · the best legal 15 at today's prices`
      : source.kind === 'built'
        ? `Built by hand · advised for gameweek ${team.advice.gameweekId}`
        : `Imported · picks locked in gameweek ${squad.gameweekId}`;
  const facts = [
    source.kind === 'manager' && squad.managerName ? `Team ${squad.managerId}` : null,
    `${money(squad.teamValue)} squad`,
    `${money(squad.bank)} bank`,
    plan
      ? `${plan.freeTransfers} free transfer${plan.freeTransfers === 1 ? '' : 's'}${plan.freeTransfersSource === 'stated' ? ' (as stated)' : plan.freeTransfersReconstructed ? '' : ' at least'}`
      : null,
    squad.activeChip ? `${squad.activeChip} active` : null,
  ].filter((f): f is string => f !== null);

  const q = team.query;
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{eyebrow}</p>
        <h1 className="num text-[28px] font-extrabold leading-[1.05] text-ink sm:text-[30px]">
          {teamTitle(team)}
        </h1>
        <p className="text-[13px] text-ink-2">{facts.join(' · ')}</p>
      </div>
      <Tabs
        active={active}
        className="self-start md:self-auto"
        items={[
          { key: 'week', label: 'Week', href: `${team.basePath}${q}` },
          { key: 'plan', label: 'Plan', href: `${team.basePath}/plan${q}` },
          { key: 'squad', label: 'Squad', href: `${team.basePath}/squad${q}` },
          { key: 'model', label: 'Model', href: `${team.basePath}/model${q}` },
        ]}
      />
    </div>
  );
}
