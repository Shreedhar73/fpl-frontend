import { positionColor } from '@/components/ui/badge';
import { cx, money, points } from '@/lib/format';
import { isFlagged, statusLabel, statusTone } from '@/lib/status';
import type { Advice, Squad, SquadPick } from '../api/squad.api';
import { PlayerTrigger } from './player-sheet/player-trigger';

/**
 * The 15, laid out the way FPL lays them out: the XI in rows by position, the bench beneath in
 * substitution order. A server component — the only JavaScript on it is the tap target around
 * each shirt, a client leaf that opens the player sheet.
 *
 * The projected points on each shirt come from the advice payload the view already holds, joined
 * by `playerId`, and so does the availability flag now that the advice DTO carries `status`
 * (plan 030 closed the contract gap plan 008 recorded).
 */

const ROWS: SquadPick['position'][] = ['GKP', 'DEF', 'MID', 'FWD'];

interface ShirtFacts {
  ep?: number;
  status?: string;
  news?: string | null;
}

function factsIndex(advice?: Advice): Map<string, ShirtFacts> {
  const map = new Map<string, ShirtFacts>();
  for (const p of advice?.players ?? [])
    map.set(p.playerId, { ep: p.epNextGw, status: p.status, news: p.news });
  return map;
}

function Shirt({
  pick,
  facts,
  isModelCaptain,
}: {
  pick: SquadPick;
  facts?: ShirtFacts;
  isModelCaptain?: boolean;
}) {
  const color = positionColor(pick.position);
  const flagged = isFlagged(facts?.status);

  return (
    <PlayerTrigger playerId={pick.playerId} name={pick.webName} block>
      <div
        className={cx(
          'relative w-[5rem] overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-raised)] transition-shadow hover:shadow-[var(--shadow-sheet)] sm:w-[5.75rem]',
          // The model's pick and the armband you actually set are different claims, and on an
          // imported squad they often disagree. Ring the one the model would captain.
          isModelCaptain && 'ring-2 ring-white',
        )}
      >
        <div aria-hidden className="h-1.5" style={{ backgroundColor: color }} />
        {flagged && facts?.status && (
          <span
            title={facts.news ?? statusLabel(facts.status)}
            aria-label={statusLabel(facts.status)}
            className={cx(
              'absolute right-1 top-2.5 grid size-3.5 place-items-center rounded-full text-[8px] font-bold text-white',
              statusTone(facts.status) === 'warn' ? 'bg-warn' : 'bg-bad',
            )}
          >
            !
          </span>
        )}
        <div className="px-1.5 pb-1.5 pt-1 text-center">
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
          {facts?.ep !== undefined && (
            <div
              className="mt-1 rounded-lg bg-surface-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink"
              title={`Projected points this gameweek${pick.isCaptain ? ', before the captain’s double' : ''}`}
            >
              {points(facts.ep)}
              <span className="ml-0.5 text-[9px] font-medium text-ink-3">xP</span>
            </div>
          )}
        </div>
      </div>
    </PlayerTrigger>
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
  const facts = factsIndex(advice);
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
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]"
    >
      <div className="pitch pitch-markings relative overflow-hidden px-3 pb-8 pt-6 sm:px-5">
        <span aria-hidden className="pitch-centre" />
        <div className="relative flex flex-col gap-3.5 sm:gap-5">
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
                    facts={facts.get(p.playerId)}
                    isModelCaptain={p.playerId === modelCaptainId}
                  />
                ))}
              </div>
            );
          })}
        </div>
        <p className="relative mt-5 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
          {formation}
        </p>
      </div>

      <div className="border-t border-line bg-surface-2 px-3 py-3 sm:px-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Bench · in the order they come on
        </h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {bench.map((p, i) => (
            <div key={p.playerId} className="flex items-center gap-1.5">
              <span className="grid size-5 place-items-center rounded-full border border-line-strong text-[10px] font-semibold tabular-nums text-ink-3">
                {i + 1}
              </span>
              <Shirt pick={p} facts={facts.get(p.playerId)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-3 py-2 text-[11px] text-ink-3 sm:px-5">
        <span>Tap a player for the full case</span>
        <span aria-hidden>·</span>
        <span>
          <strong className="font-semibold text-ink-2">C</strong> /{' '}
          <strong className="font-semibold text-ink-2">V</strong> your armband
        </span>
        <span>
          <strong className="font-semibold text-ink-2">★</strong> the model would captain
        </span>
        <span>
          <strong className="font-semibold text-ink-2">!</strong> a doubt or an injury
        </span>
        {armbandDisagrees && (
          <span className="text-warn">
            Your armband and the model&apos;s pick are on different players.
          </span>
        )}
      </div>
    </section>
  );
}
