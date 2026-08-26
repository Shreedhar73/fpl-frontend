import { positionColor } from '@/components/ui/badge';
import { cx, money, points } from '@/lib/format';
import type { Advice, Squad, SquadPick } from '../api/squad.api';

/**
 * The 15, laid out the way FPL lays them out: the XI in rows by position, the bench beneath in
 * substitution order. A server component — it holds no state, so it ships no JavaScript.
 *
 * The projected points on each shirt come from the advice payload the view already holds, joined
 * by `playerId`. It is the single most useful number the app has and it used to live only in a
 * table below the fold; putting it on the shirt costs no extra request.
 *
 * What is deliberately absent: injury flags. `status` and `news` are on `PlayerListItemDto` only —
 * neither the squad nor the advice DTO carries them — so a red flag here would need a second fetch
 * over 614 players and a join. That is a contract gap (B-009), not a design choice.
 */

const ROWS: SquadPick['position'][] = ['GKP', 'DEF', 'MID', 'FWD'];

type EpByPlayer = Map<string, number>;

function epIndex(advice?: Advice): EpByPlayer {
  const map: EpByPlayer = new Map();
  for (const p of advice?.players ?? []) map.set(p.playerId, p.epNextGw);
  return map;
}

function Shirt({
  pick,
  ep,
  isModelCaptain,
}: {
  pick: SquadPick;
  ep?: number;
  isModelCaptain?: boolean;
}) {
  const color = positionColor(pick.position);

  return (
    <div
      className={cx(
        'w-[4.75rem] overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-raised)] sm:w-[5.5rem]',
        // The model's pick and the armband you actually set are different claims, and on an
        // imported squad they often disagree. Ring the one the model would captain.
        isModelCaptain && 'ring-2 ring-white ring-offset-0',
      )}
    >
      <div aria-hidden className="h-1" style={{ backgroundColor: color }} />
      <div className="px-1.5 py-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="truncate text-[11px] font-semibold text-ink sm:text-xs">
            {pick.webName}
          </span>
          {isModelCaptain && (
            <Armband title="The model would captain this player">★</Armband>
          )}
          {pick.isCaptain && <Armband title="Your captain, as locked">C</Armband>}
          {pick.isViceCaptain && (
            <Armband title="Your vice-captain, as locked">V</Armband>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-ink-3">
          <span className="uppercase tracking-wide">{pick.teamShortName}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{money(pick.nowCost)}</span>
        </div>
        {ep !== undefined && (
          <div
            className="mt-1 rounded bg-surface-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink"
            title={`Projected points this gameweek${pick.isCaptain ? ', before the captain’s double' : ''}`}
          >
            {points(ep)}
            <span className="ml-0.5 text-[9px] font-medium text-ink-3">xP</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Armband({ children, title }: { children: string; title: string }) {
  return (
    <span
      title={title}
      className="grid size-4 shrink-0 place-items-center rounded-full bg-ink text-[9px] font-bold text-surface"
    >
      {children}
    </span>
  );
}

export function Pitch({ squad, advice }: { squad: Squad; advice?: Advice }) {
  const ep = epIndex(advice);
  const modelCaptainId = advice?.captain?.playerId;
  const yourCaptain = squad.picks.find((p) => p.isCaptain);
  const armbandDisagrees =
    modelCaptainId !== undefined &&
    yourCaptain !== undefined &&
    yourCaptain.playerId !== modelCaptainId;
  const xi = squad.picks.filter((p) => p.slot <= 11);
  const bench = squad.picks.filter((p) => p.slot > 11);
  const formation = ROWS.slice(1)
    .map((row) => xi.filter((p) => p.position === row).length)
    .join('-');

  return (
    <section
      aria-label="Squad"
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]"
    >
      <div className="pitch pitch-markings relative px-3 py-5 sm:px-5">
        <div className="flex flex-col gap-3 sm:gap-4">
          {ROWS.map((row) => {
            const line = xi.filter((p) => p.position === row);
            if (line.length === 0) return null;
            return (
              <div
                key={row}
                className="flex flex-wrap justify-center gap-1.5 sm:gap-3"
              >
                {line.map((p) => (
                  <Shirt
                    key={p.playerId}
                    pick={p}
                    ep={ep.get(p.playerId)}
                    isModelCaptain={p.playerId === modelCaptainId}
                  />
                ))}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
          {formation}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-3 py-2 text-[11px] text-ink-3 sm:px-5">
        <span>
          <strong className="font-semibold text-ink-2">C</strong> /{' '}
          <strong className="font-semibold text-ink-2">V</strong> your armband
        </span>
        <span>
          <strong className="font-semibold text-ink-2">★</strong> the model
          would captain
        </span>
        <span>
          <strong className="font-semibold text-ink-2">xP</strong> projected
          points this gameweek
        </span>
        {armbandDisagrees && (
          <span className="text-warn">
            Your armband and the model&apos;s pick are on different players.
          </span>
        )}
      </div>

      <div className="border-t border-line bg-surface-2 px-3 py-3 sm:px-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Bench — in the order they come on
        </h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {bench.map((p, i) => (
            <div key={p.playerId} className="flex items-center gap-1.5">
              <span className="grid size-5 place-items-center rounded-full border border-line-strong text-[10px] font-semibold tabular-nums text-ink-3">
                {i + 1}
              </span>
              <Shirt pick={p} ep={ep.get(p.playerId)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
