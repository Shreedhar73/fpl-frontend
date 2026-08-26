import type { Squad, SquadPick } from '../api/squad.api';
import { money } from '../api/squad.api';

/**
 * The 15, laid out the way FPL lays them out: the XI in rows by position, the bench beneath in
 * substitution order. A server component — it holds no state, so it ships no JavaScript.
 */

const ROWS: SquadPick['position'][] = ['GKP', 'DEF', 'MID', 'FWD'];

function PlayerCard({ pick }: { pick: SquadPick }) {
  return (
    <div className="flex min-w-20 flex-col items-center gap-0.5 rounded-md bg-white/90 px-2 py-1.5 text-center shadow-sm ring-1 ring-black/5 dark:bg-zinc-900/90 dark:ring-white/10">
      <div className="flex items-center gap-1">
        <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
          {pick.webName}
        </span>
        {pick.isCaptain && <Badge title="Captain">C</Badge>}
        {pick.isViceCaptain && <Badge title="Vice-captain">V</Badge>}
      </div>
      <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {pick.teamShortName}
      </span>
      <span className="text-[10px] tabular-nums text-zinc-600 dark:text-zinc-400">
        {money(pick.nowCost)}
      </span>
    </div>
  );
}

function Badge({ children, title }: { children: string; title: string }) {
  return (
    <span
      title={title}
      className="rounded-full bg-zinc-900 px-1 text-[9px] font-bold leading-4 text-white dark:bg-zinc-100 dark:text-zinc-900"
    >
      {children}
    </span>
  );
}

export function Pitch({ squad }: { squad: Squad }) {
  const xi = squad.picks.filter((p) => p.slot <= 11);
  const bench = squad.picks.filter((p) => p.slot > 11);

  return (
    <section aria-label="Squad">
      <div className="rounded-lg bg-emerald-700/90 p-4 dark:bg-emerald-900/60">
        <div className="flex flex-col gap-3">
          {ROWS.map((row) => {
            const line = xi.filter((p) => p.position === row);
            if (line.length === 0) return null;
            return (
              <div key={row} className="flex flex-wrap justify-center gap-2">
                {line.map((p) => (
                  <PlayerCard key={p.playerId} pick={p} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Bench — in the order they come on
        </h3>
        <div className="flex flex-wrap gap-2">
          {bench.map((p, i) => (
            <div key={p.playerId} className="flex items-center gap-1.5">
              <span className="text-xs tabular-nums text-zinc-400">{i + 1}</span>
              <PlayerCard pick={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
