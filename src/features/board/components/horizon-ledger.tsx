import { HorizonTable, type LedgerRow } from './horizon-table';
import { bestXiTotals, horizonSum } from '@/lib/horizon';
import { points } from '@/lib/format';
import type { TeamData } from '../load-team';
import { Eyebrow } from './why';

/**
 * The Squad tab: every player against every horizon gameweek. Rows are built here on the server
 * from the advice; the table is a client leaf only because it sorts.
 */
export function HorizonLedger({ team }: { team: TeamData }) {
  const { advice, players } = team;
  const gws = advice.horizonGameweekIds;
  const inBest = new Set(
    players
      .map((p) => p.playerId)
      .filter((id) => !advice.comparison.youHaveThatOptimalDoesNot.some((d) => d.playerId === id)),
  );
  const rows: LedgerRow[] = players.map((p) => ({
    playerId: p.playerId,
    webName: p.webName,
    position: p.position,
    teamShortName: p.teamShortName,
    nowCost: p.nowCost,
    role: p.role,
    benchOrder: p.benchOrder,
    slot: p.slot,
    isCaptain: p.isCaptain,
    status: p.status,
    news: p.news,
    chance: p.chanceOfPlayingNextRound,
    plays: p.evidence?.playProbability ?? null,
    cells: gws.map((gw) => {
      const h = p.horizon.find((x) => x.gameweekId === gw);
      return { gameweekId: gw, ep: h?.expectedPoints ?? null, fixtures: h?.fixtures ?? [] };
    }),
    sum: horizonSum(p),
    inBest: inBest.has(p.playerId),
  }));
  const totals = bestXiTotals(players, gws);
  const c = advice.comparison;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <Eyebrow>Horizon · gameweeks {gws[0]} to {gws[gws.length - 1]}</Eyebrow>
          <span className="text-xs text-ink-3">· tap a column to sort · cell tone is FPL difficulty</span>
        </div>
      </div>
      <HorizonTable rows={rows} gws={gws} isModels={team.source.kind !== 'manager'} />
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-2 text-[12.5px]">
        <span className="text-ink-2">
          Best XI each week:{' '}
          <span className="num font-bold text-ink">{totals.map((t) => (t.total === null ? '—' : points(t.total))).join(' · ')}</span>
          {' · '}squad Σ <span className="num font-extrabold text-ink">{points(c.squadHorizonEp)}</span>
          {' · '}best 15 <span className="num font-extrabold text-ink">{points(c.optimalHorizonEp)}</span>
        </span>
        <span className="text-ink-3">Σ is the squad&apos;s decayed horizon points as the optimizer scores them; the cells are undecayed.</span>
      </div>
    </div>
  );
}
