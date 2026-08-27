import { PositionChip } from '@/components/ui/badge';
import { Bar } from '@/components/ui/meter';
import { cx, money, percent, points } from '@/lib/format';
import type { AdvicePlayer } from '../api/squad.api';

/**
 * The 15 as a roster: what the model expects from each of them, and the terms that expectation is
 * made of. Two layouts of the same data — a table from `sm` up, stacked cards below it — because a
 * five-column table on a phone is a horizontal scroll, and a horizontal scroll on the app's densest
 * screen is where people stop reading.
 *
 * A server component. The bars are `div`s, so the whole thing ships as HTML.
 */

const ROLE_ORDER: Record<AdvicePlayer['role'], number> = {
  captain: 0,
  vice: 1,
  starter: 2,
  bench: 3,
};

function roleLabel(player: AdvicePlayer): string {
  switch (player.role) {
    case 'captain':
      return 'Captain';
    case 'vice':
      return 'Vice';
    case 'bench':
      return `Bench ${player.benchOrder ?? ''}`.trim();
    default:
      return 'Starter';
  }
}

/** `cleanSheet` reads as a debug key. The model's own component names are the label, spaced out. */
function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase();
}

function Terms({ player }: { player: AdvicePlayer }) {
  if (!player.evidence) {
    return (
      <span className="text-[11px] text-ink-3">
        no projection this gameweek
      </span>
    );
  }

  const terms = Object.entries(player.evidence.components)
    .filter(([, v]) => Math.abs(v) >= 0.05)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 4);

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span
        className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] tabular-nums text-ink-2"
        title="Probability of playing, and the minutes the model expects"
      >
        {percent(player.evidence.playProbability)} ·{' '}
        {player.evidence.expectedMinutes.toFixed(0)}′
      </span>
      {terms.map(([key, value]) => (
        <span
          key={key}
          className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-2"
          title={`${humanize(key)} contributes ${value.toFixed(2)} points`}
        >
          {humanize(key)}{' '}
          <span
            className={cx(
              'font-semibold tabular-nums',
              value < 0 ? 'text-bad' : 'text-ink',
            )}
          >
            {value > 0 ? '+' : '−'}
            {Math.abs(value).toFixed(2)}
          </span>
        </span>
      ))}
    </div>
  );
}

export function PlayerTable({ players }: { players: AdvicePlayer[] }) {
  const sorted = [...players].sort(
    (a, b) =>
      ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
      (a.benchOrder ?? 0) - (b.benchOrder ?? 0) ||
      b.epHorizon - a.epHorizon,
  );
  const maxGw = Math.max(1, ...sorted.map((p) => p.epNextGw));

  return (
    <>
      {/* Phones: one card per player, nothing off-screen. */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {sorted.map((p) => (
          <li
            key={p.playerId}
            className="rounded-xl border border-line bg-surface p-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <PositionChip position={p.position} />
                <span className="text-sm font-semibold text-ink">
                  {p.webName}
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-ink">
                {points(p.epNextGw)}
                <span className="ml-0.5 text-[10px] font-medium text-ink-3">
                  xP
                </span>
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-ink-3">
              <span>
                {p.teamShortName} · {money(p.nowCost)} · {roleLabel(p)}
              </span>
              <span className="tabular-nums">
                {points(p.epHorizon)} over the horizon
              </span>
            </div>
            <Bar
              value={p.epNextGw}
              max={maxGw}
              className="mt-2"
              color="var(--ink-2)"
            />
            <div className="mt-2">
              <Terms player={p} />
            </div>
          </li>
        ))}
      </ul>

      <table className="hidden w-full text-left sm:table">
        <caption className="sr-only">
          Every player in the squad with projected points and the terms behind
          them
        </caption>
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-ink-3">
            <th className="pb-2 pr-3 font-medium">Player</th>
            <th className="pb-2 pr-3 font-medium">Role</th>
            <th className="pb-2 pr-3 text-right font-medium">
              <abbr title="Projected points, this gameweek">GW xP</abbr>
            </th>
            <th className="pb-2 pr-3 text-right font-medium">
              <abbr title="Projected points across the whole horizon">
                Horizon
              </abbr>
            </th>
            <th className="pb-2 pr-3 text-right font-medium">
              <abbr title="P(2 points or fewer — the appearance and nothing else). Two players with the same projection are not the same bet.">
                Blank
              </abbr>
            </th>
            <th className="pb-2 font-medium">Why</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr
              key={p.playerId}
              className="border-t border-line align-top transition-colors hover:bg-surface-2"
            >
              <td className="py-2 pr-3">
                <div className="flex items-center gap-1.5">
                  <PositionChip position={p.position} />
                  <span className="text-sm font-medium text-ink">
                    {p.webName}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-ink-3">
                  {p.teamShortName} · {money(p.nowCost)}
                </div>
              </td>
              <td className="py-2 pr-3 text-xs text-ink-2">{roleLabel(p)}</td>
              <td className="w-28 py-2 pr-3 text-right">
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {points(p.epNextGw)}
                </span>
                <Bar
                  value={p.epNextGw}
                  max={maxGw}
                  className="mt-1"
                  color="var(--ink-2)"
                />
              </td>
              <td className="py-2 pr-3 text-right text-sm tabular-nums text-ink-2">
                {points(p.epHorizon)}
              </td>
              {/*
                An em dash, not 0%, when the projection carries no distribution. A zero here would
                read as "this player never blanks", which is the single most misleading thing this
                column could say.
              */}
              <td className="py-2 pr-3 text-right text-sm tabular-nums text-ink-3">
                {p.evidence?.pBlank === null ||
                p.evidence?.pBlank === undefined ? (
                  <span title="This projection was written by a model version that carried no distribution">
                    —
                  </span>
                ) : (
                  <>
                    {percent(p.evidence.pBlank)}
                    {p.evidence.sd !== null && p.evidence.sd !== undefined && (
                      <span className="block text-[10px] text-ink-3">
                        ±{p.evidence.sd.toFixed(1)}
                      </span>
                    )}
                  </>
                )}
              </td>
              <td className="py-2">
                <Terms player={p} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
