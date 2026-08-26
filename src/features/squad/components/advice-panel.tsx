import type { Advice, AdvicePlayer } from '../api/squad.api';
import { money } from '../api/squad.api';

/**
 * What the model would do with this squad, and how far the squad is from the best legal one.
 *
 * The transfer affordance is deliberately disabled and labelled. Transfers need sell value, which
 * no public FPL endpoint exposes, and a hit calculation — that is B-008. A plausible-looking
 * suggestion built from a subtraction would be worse than an honest gap.
 */

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
      <dt className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </dd>
      {hint && (
        <p className="mt-0.5 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function Evidence({ player }: { player: AdvicePlayer }) {
  if (!player.evidence) {
    return (
      <span className="text-[11px] text-zinc-400">no projection this gameweek</span>
    );
  }
  const terms = Object.entries(player.evidence.components)
    .filter(([, v]) => Math.abs(v) >= 0.05)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  return (
    <span className="text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
      {Math.round(player.evidence.playProbability * 100)}% to play ·{' '}
      {player.evidence.expectedMinutes.toFixed(0)} min ·{' '}
      {terms.map(([k, v], i) => (
        <span key={k}>
          {i > 0 && ', '}
          {k} {v.toFixed(2)}
        </span>
      ))}
    </span>
  );
}

function PlayerRow({ player }: { player: AdvicePlayer }) {
  const roleLabel =
    player.role === 'captain'
      ? 'Captain'
      : player.role === 'vice'
        ? 'Vice'
        : player.role === 'bench'
          ? `Bench ${player.benchOrder ?? ''}`.trim()
          : 'Starter';

  return (
    <tr className="border-t border-zinc-100 align-top dark:border-zinc-800">
      <td className="py-2 pr-3">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {player.webName}
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {player.position} · {player.teamShortName} · {money(player.nowCost)}
        </div>
      </td>
      <td className="py-2 pr-3 text-xs text-zinc-600 dark:text-zinc-400">
        {roleLabel}
      </td>
      <td className="py-2 pr-3 text-right text-sm tabular-nums text-zinc-900 dark:text-zinc-50">
        {player.epNextGw.toFixed(2)}
      </td>
      <td className="py-2 pr-3 text-right text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
        {player.epHorizon.toFixed(2)}
      </td>
      <td className="py-2">
        <Evidence player={player} />
      </td>
    </tr>
  );
}

export function AdvicePanel({ advice }: { advice: Advice }) {
  const c = advice.comparison;
  const order: Record<AdvicePlayer['role'], number> = {
    captain: 0,
    vice: 1,
    starter: 2,
    bench: 3,
  };
  const players = [...advice.players].sort(
    (a, b) =>
      order[a.role] - order[b.role] ||
      (a.benchOrder ?? 0) - (b.benchOrder ?? 0) ||
      b.epHorizon - a.epHorizon,
  );

  return (
    <section aria-label="Advice" className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Gameweek {advice.gameweekId}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Model {advice.modelVersion} · horizon GW
          {advice.horizonGameweekIds.join(', ')}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="Captain"
          value={advice.captain?.webName ?? '—'}
          hint={
            advice.captain
              ? `${advice.captain.epNextGw.toFixed(2)} pts projected`
              : undefined
          }
        />
        <Stat
          label="Vice"
          value={advice.viceCaptain?.webName ?? '—'}
          hint="Steps in if the captain does not play"
        />
        <Stat
          label="Your XI"
          value={c.xiNextGwEp.toFixed(1)}
          hint="Projected points, captain doubled"
        />
        <Stat
          label="Behind the best 15"
          value={c.horizonGap.toFixed(1)}
          hint={`Over ${advice.horizonGameweekIds.length} gameweeks`}
        />
      </dl>

      <div className="rounded-lg bg-zinc-50 p-3 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Against the optimal squad
        </h3>
        <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
          Your 15 project {c.squadHorizonEp.toFixed(1)} over the horizon; the best
          legal 15 projects {c.optimalHorizonEp.toFixed(1)}. Your best formation is{' '}
          {c.formation}, the optimal squad plays {c.optimalFormation}.
        </p>

        {c.optimalHasThatYouDoNot.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <h4 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                In the optimal squad, not in yours
              </h4>
              <ul className="mt-1 space-y-0.5">
                {c.optimalHasThatYouDoNot.slice(0, 6).map((p) => (
                  <li
                    key={p.playerId}
                    className="text-xs tabular-nums text-zinc-700 dark:text-zinc-300"
                  >
                    {p.webName}{' '}
                    <span className="text-zinc-400">
                      {p.position} · {money(p.nowCost)} · {p.epHorizon.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                In yours, not in the optimal squad
              </h4>
              <ul className="mt-1 space-y-0.5">
                {c.youHaveThatOptimalDoesNot.slice(0, 6).map((p) => (
                  <li
                    key={p.playerId}
                    className="text-xs tabular-nums text-zinc-700 dark:text-zinc-300"
                  >
                    {p.webName}{' '}
                    <span className="text-zinc-400">
                      {p.position} · {money(p.nowCost)} · {p.epHorizon.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <button
            type="button"
            disabled
            title="Not built yet — see below"
            className="cursor-not-allowed rounded-md bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
          >
            Plan transfers
          </button>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Not built yet. This is a set difference, not a transfer plan.
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            {/* The header padding must match the cells' — without pr-3 the three right-hand
                headings butt together and read as one word. */}
            <tr className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <th className="pb-1 pr-3 font-medium">Player</th>
              <th className="pb-1 pr-3 font-medium">Role</th>
              <th className="pb-1 pr-3 text-right font-medium">GW</th>
              <th className="pb-1 pr-3 text-right font-medium">Horizon</th>
              <th className="pb-1 font-medium">Why</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <PlayerRow key={p.playerId} player={p} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          What this does not answer
        </h3>
        <ul className="mt-1 space-y-1">
          {advice.notAdvisedOn.map((line) => (
            <li
              key={line}
              className="text-xs leading-5 text-zinc-600 dark:text-zinc-400"
            >
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
