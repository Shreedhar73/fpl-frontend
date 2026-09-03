import { positionColor } from '@/components/ui/badge';
import { BlankTag, FixtureTag, difficultyClass } from '@/components/ui/fixture-tag';
import { cx, money, points } from '@/lib/format';
import { isFlagged, statusLabel, statusTone } from '@/lib/status';
import { PlayerTrigger } from '@/features/squad/components/player-sheet/player-trigger';
import type { BoardPlayer, TeamData } from '../load-team';
import { PitchMode } from './pitch-mode';
import { Eyebrow, Why } from './why';

/**
 * The 15 as the picks lay them out, every shirt carrying its next fixture — or, on the toggle,
 * the five-cell run. Two server-rendered pitches; the client leaf only chooses which is shown.
 */

type Row = BoardPlayer['position'];
const ROWS: Row[] = ['GKP', 'DEF', 'MID', 'FWD'];

function Shirt({
  p,
  mode,
  modelCaptainId,
  compact = false,
}: {
  p: BoardPlayer;
  mode: 'gw' | 'horizon';
  modelCaptainId?: string;
  compact?: boolean;
}) {
  const next = p.horizon[0];
  const flagged = isFlagged(p.status);
  const isModelCaptain = p.playerId === modelCaptainId;
  const mark = isModelCaptain ? 'C' : p.role === 'vice' ? 'V' : null;

  return (
    <PlayerTrigger playerId={p.playerId} name={p.webName} block>
      <div
        className={cx(
          'relative overflow-hidden rounded-[10px] border bg-surface shadow-[var(--shadow-raised)] transition-shadow hover:shadow-[var(--shadow-sheet)]',
          isModelCaptain ? 'border-ink ring-1 ring-ink' : 'border-line-strong',
          compact ? 'w-[4.125rem]' : 'w-[5.25rem] sm:w-[7rem]',
        )}
      >
        <div aria-hidden className="h-[5px]" style={{ backgroundColor: positionColor(p.position) }} />
        {mark && (
          <span
            title={mark === 'C' ? 'The model would captain this player' : 'The model’s vice-captain'}
            className={cx(
              'num absolute right-1.5 top-2 grid size-[17px] place-items-center rounded-full text-[9px] font-extrabold',
              mark === 'C' ? 'bg-good text-canvas' : 'bg-surface-3 text-ink',
            )}
          >
            {mark}
          </span>
        )}
        {flagged && (
          <span
            title={p.news ?? statusLabel(p.status)}
            aria-label={statusLabel(p.status)}
            className={cx(
              'absolute left-1.5 top-2 grid size-[15px] place-items-center rounded-full text-[8px] font-bold text-white',
              statusTone(p.status) === 'warn' ? 'bg-warn' : 'bg-bad',
            )}
          >
            !
          </span>
        )}
        <div className={cx('flex flex-col gap-px', compact ? 'px-1.5 pb-1.5 pt-1.5' : 'px-2 pb-2 pt-1.5')}>
          <span className={cx('truncate font-semibold text-ink', compact ? 'text-[10.5px]' : 'text-[11px] sm:text-[12.5px]', (mark || flagged) && 'pr-3')}>
            {p.webName}
          </span>
          <span className={cx('truncate text-ink-3', compact ? 'text-[9.5px]' : 'text-[10px]')}>
            {p.teamShortName}
            {!compact && <> · {money(p.nowCost)}</>}
          </span>
          <span className={cx('num mt-0.5 font-bold leading-none text-ink', compact ? 'text-[15px]' : 'text-[17px] sm:text-[20px]')}>
            {points(p.epNextGw)}
            {!compact && <span className="ml-0.5 text-[9px] font-semibold text-ink-3">xP</span>}
          </span>
          {mode === 'gw' ? (
            <span className="mt-1 flex flex-wrap gap-0.5">
              {next === undefined ? null : next.fixtures.length === 0 ? (
                <BlankTag size="sm" />
              ) : (
                next.fixtures.map((f, i) => (
                  <FixtureTag key={i} opponent={f.opponentShortName} isHome={f.isHome} difficulty={f.difficulty} size="sm" />
                ))
              )}
            </span>
          ) : (
            <Ticker p={p} />
          )}
        </div>
      </div>
    </PlayerTrigger>
  );
}

/** Five cells, one per horizon gameweek: the tone is the fixture, the number the xP. */
function Ticker({ p }: { p: BoardPlayer }) {
  return (
    <span className="mt-1 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.max(1, p.horizon.length)}, minmax(0, 1fr))` }}>
      {p.horizon.map((h) => {
        const f = h.fixtures[0];
        return (
          <span
            key={h.gameweekId}
            title={`GW ${h.gameweekId}: ${h.fixtures.length === 0 ? 'blank' : h.fixtures.map((x) => `${x.opponentShortName} ${x.isHome ? 'H' : 'A'} (${x.difficulty})`).join(', ')}${h.expectedPoints === null ? '' : ` · ${points(h.expectedPoints)} xP`}`}
            className={cx(
              'num flex h-[18px] items-center justify-center rounded-[4px] text-[9px] font-bold',
              f ? difficultyClass(f.difficulty) : 'border border-dashed border-line-strong text-ink-3',
              h.fixtures.length > 1 && 'ring-1 ring-ink/40',
            )}
          >
            {h.expectedPoints === null ? '·' : h.expectedPoints.toFixed(1)}
          </span>
        );
      })}
    </span>
  );
}

function PitchSurface({ team, mode, compact }: { team: TeamData; mode: 'gw' | 'horizon'; compact?: boolean }) {
  const { players, advice } = team;
  const xi = players.filter((p) => p.slot <= 11);
  return (
    <div className="pitch pitch-markings relative overflow-hidden rounded-[14px] px-2 pb-7 pt-6 sm:px-4">
      <span aria-hidden className="pitch-centre" />
      <div className={cx('relative flex flex-col', compact ? 'gap-2' : 'gap-3.5 sm:gap-4')}>
        {ROWS.map((row) => {
          const line = xi.filter((p) => p.position === row);
          if (line.length === 0) return null;
          return (
            <div key={row} className={cx('flex justify-center', compact ? 'gap-1.5' : 'gap-2 sm:gap-3.5')}>
              {line.map((p) => (
                <Shirt key={p.playerId} p={p} mode={mode} modelCaptainId={advice.captain?.playerId} compact={compact} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BoardPitch({ team }: { team: TeamData }) {
  const gwLabel = `Gameweek ${team.advice.gameweekId}`;
  return (
    <div className="flex flex-col gap-3">
      <PitchMode
        gwLabel={gwLabel}
        legend={
          <span className="hidden text-xs text-ink-3 sm:inline">
            Tap a shirt for the case · <b className="font-bold text-good">C</b> the model&apos;s armband · fixture tone is FPL difficulty
          </span>
        }
        gw={
          <>
            <div className="hidden sm:block"><PitchSurface team={team} mode="gw" /></div>
            <div className="sm:hidden"><PitchSurface team={team} mode="gw" compact /></div>
          </>
        }
        horizon={
          <>
            <div className="hidden sm:block"><PitchSurface team={team} mode="horizon" /></div>
            <div className="sm:hidden"><PitchSurface team={team} mode="horizon" compact /></div>
          </>
        }
      />
    </div>
  );
}

/** The bench in the model's order, with where the picked order differs. */
export function Bench({ team }: { team: TeamData }) {
  const { players, basePath, query } = team;
  const model = players.filter((p) => p.role === 'bench').sort((a, b) => (a.benchOrder ?? 9) - (b.benchOrder ?? 9));
  const picked = players.filter((p) => p.slot > 11).sort((a, b) => a.slot - b.slot).map((p) => p.playerId);
  const same = model.every((p, i) => picked[i] === p.playerId);
  const firstDiff = model.findIndex((p, i) => picked[i] !== p.playerId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Eyebrow>Bench · in the order the model would use it</Eyebrow>
        {same ? (
          <span className="text-xs font-semibold text-ink-3">Same as yours</span>
        ) : (
          <Why href={`${basePath}/squad${query}`}>Yours differs from {firstDiff + 1}</Why>
        )}
      </div>
      <div className="flex gap-1.5 sm:gap-3">
        {model.map((p, i) => (
          <div key={p.playerId} className="flex flex-col items-center gap-1">
            <span className="num text-[11px] font-bold text-ink-3">{i + 1}</span>
            <div className="hidden sm:block"><Shirt p={p} mode="gw" /></div>
            <div className="sm:hidden"><Shirt p={p} mode="gw" compact /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
