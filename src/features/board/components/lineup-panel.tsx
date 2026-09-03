import { PositionChip } from '@/components/ui/badge';
import { cx, delta, points } from '@/lib/format';
import { bestXiTotals, lineupSwaps, pickedXiEp, picksAreModels } from '@/lib/horizon';
import { isFlagged, statusLabel } from '@/lib/status';
import { PlayerTrigger } from '@/features/squad/components/player-sheet/player-trigger';
import type { TeamData } from '../load-team';
import { Eyebrow, Why } from './why';

/**
 * This gameweek in three numbers, the doubts, and the next five as a strip. "Lineup only" is the
 * model's arrangement of these 15 against the picked one — from the same `epNextGw` rows as
 * `comparison.xiNextGwEp`, so the two never disagree by construction.
 */
export function LineupPanel({ team }: { team: TeamData }) {
  const { advice, players, basePath, query } = team;
  const c = advice.comparison;
  const isModels = picksAreModels(players);
  const yours = pickedXiEp(players);
  const lineupOnly = c.xiNextGwEp - yours;
  const swaps = isModels ? [] : lineupSwaps(players);
  const doubts = players.filter((p) => isFlagged(p.status));
  const totals = bestXiTotals(players, advice.horizonGameweekIds);
  const max = Math.max(1, ...totals.map((t) => t.total ?? 0));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-baseline justify-between">
          <Eyebrow>This gameweek</Eyebrow>
          <Why href={`${basePath}/squad${query}`}>Squad</Why>
        </div>
        <dl className="hairline-x mt-2 grid grid-cols-3 border-t border-line">
          <Cell label={isModels ? 'The XI' : 'Your XI'} value={points(isModels ? c.xiNextGwEp : yours)} />
          <Cell label="Best 15’s XI" value={points(c.optimalXiNextGwEp)} />
          {isModels ? (
            <Cell label="Gap" value={delta(-c.xiNextGwGap)} tone={c.xiNextGwGap < 0.05 ? 'good' : 'neutral'} />
          ) : (
            <Cell label="Lineup only" value={delta(lineupOnly)} tone={lineupOnly > 0.05 ? 'good' : 'neutral'} />
          )}
        </dl>
        <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-2">
          {isModels
            ? c.xiNextGwGap < 0.05
              ? 'This XI is the best XI buildable at today’s prices.'
              : `The best 15’s XI is ${delta(c.xiNextGwGap)} ahead this week; that is squad, not lineup.`
            : swaps.length === 0
              ? `Your XI is the one the model would field. The rest of the ${delta(c.optimalXiNextGwEp - yours)} gap is squad, not lineup.`
              : `${swaps.map((s) => `${s.in.webName} for ${s.out.webName}`).join(', ')} is the lineup change worth making. The rest of the ${delta(c.optimalXiNextGwEp - yours)} gap is squad, and the plan addresses it.`}
        </p>
      </div>

      <div>
        <Eyebrow>Doubts</Eyebrow>
        <ul className="mt-1.5 flex flex-col">
          {doubts.length === 0 ? (
            <li className="flex items-center justify-between border-b border-line py-2 text-[12.5px]">
              <span className="text-ink-2">None flagged. All 15 available per FPL.</span>
              <span className="text-ink-3">status · news · chance</span>
            </li>
          ) : (
            doubts.map((p) => (
              <li key={p.playerId} className="flex items-center justify-between gap-3 border-b border-line py-2 text-[12.5px]">
                <PlayerTrigger playerId={p.playerId} name={p.webName} className="min-w-0 gap-2 hover:underline underline-offset-2">
                  <PositionChip position={p.position} />
                  <span className="truncate font-medium text-ink">{p.webName}</span>
                  <span className="text-ink-3">{p.teamShortName}</span>
                </PlayerTrigger>
                <span className={cx('shrink-0 text-right font-semibold', p.status === 'd' ? 'text-warn' : 'text-bad')}>
                  {p.chanceOfPlayingNextRound !== null ? `${p.chanceOfPlayingNextRound}% · ` : ''}
                  {statusLabel(p.status).toLowerCase()}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <Eyebrow>Next five</Eyebrow>
        <ul className="mt-1.5 flex flex-col">
          {totals.map((t, i) => (
            <li key={t.gameweekId} className="flex items-center justify-between gap-3 border-b border-line py-2 text-[12.5px]">
              <span className="text-ink-2">
                GW {t.gameweekId}
                {i === 0 && <span className="text-ink-3"> · this week</span>}
                {t.missing > 0 && t.total !== null && <span className="text-ink-3"> · {t.missing} unprojected</span>}
              </span>
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="block h-1.5 w-[120px] overflow-hidden rounded-full bg-surface-3">
                  <span className="block h-full rounded-full bg-ink-2" style={{ width: `${t.total === null ? 0 : (t.total / max) * 100}%` }} />
                </span>
                <span className="num w-9 text-right font-semibold text-ink">{t.total === null ? '—' : points(t.total)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[11.5px] text-ink-3">Best legal XI from these 15 each week, before captaincy. The full grid is on the Squad tab.</p>
      </div>
    </div>
  );
}

function Cell({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'good' }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 [&:not(:first-child)]:pl-3.5">
      <dt className="text-[11.5px] text-ink-3">{label}</dt>
      <dd className={cx('num text-[26px] font-extrabold leading-none', tone === 'good' ? 'text-good' : 'text-ink')}>{value}</dd>
    </div>
  );
}
