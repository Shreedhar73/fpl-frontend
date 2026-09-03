'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { DifficultyChip, PositionChip, StatusBadge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Provenance } from '@/components/ui/provenance';
import type { ApiResponseMeta } from '@/lib/api/types';
import {
  cx,
  humanize,
  localDate,
  localKickoff,
  money,
  moneyDelta,
  percent,
  points,
  term,
} from '@/lib/format';
import { isFlagged } from '@/lib/status';
import type {
  PlayerDetail,
  PlayerProjection,
  PlayerRecentGameweek,
} from '../../api/players.api';
import { usePlayerSheet, type SheetState } from './player-sheet-context';

/**
 * The case for one player, in the order a manager asks the questions: is he fit, what does he
 * project this week and why, what does the run of fixtures look like, how has he actually been
 * playing, and what does the crowd think. A native `<dialog>` — focus trapping, Escape and focus
 * return are the platform's — styled as a bottom sheet on a phone and a centred panel above `sm`.
 *
 * Every model number here is nullable at the edge and rendered as absence. A player the served
 * model has not reached gets the facts and an honest "no projection", never a row of zeros.
 */
export function PlayerSheet() {
  const { openId, state, close } = usePlayerSheet();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (openId && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else if (!openId && dialog.open) {
      dialog.close();
    }
  }, [openId]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="player-sheet-title"
      onClose={() => {
        document.body.style.overflow = '';
        close();
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself; content clicks land inside.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      {openId && state && <SheetBody state={state} />}
    </dialog>
  );
}

function SheetBody({ state }: { state: SheetState }) {
  const { close, retry } = usePlayerSheet();

  return (
    <div className="flex max-h-[inherit] flex-col">
      <div className="sm:hidden">
        <span aria-hidden className="mx-auto mt-2 block h-1 w-10 rounded-full bg-line-strong" />
      </div>

      {state.status === 'loading' && <Skeleton onClose={close} />}
      {state.status === 'error' && (
        <div className="p-5">
          <header className="flex items-start justify-between gap-3">
            <h2 id="player-sheet-title" className="text-lg font-semibold text-ink">
              Could not load this player
            </h2>
            <CloseButton onClick={close} />
          </header>
          <p className="mt-2 text-sm leading-6 text-ink-2">{state.message}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={retry} className={buttonClass({ size: 'sm' })}>
              Try again
            </button>
            <button
              type="button"
              onClick={close}
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {state.status === 'ready' && (
        <Detail detail={state.detail} meta={state.meta} onClose={close} />
      )}
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}

function Skeleton({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-5" aria-busy>
      <header className="flex items-start justify-between gap-3">
        <div className="animate-pulse">
          <div className="h-6 w-40 rounded-lg bg-surface-3" />
          <div className="mt-2 h-3 w-56 rounded bg-surface-2" />
        </div>
        <CloseButton onClick={onClose} />
      </header>
      <div className="mt-5 grid grid-cols-4 gap-2 animate-pulse">
        <div className="h-16 rounded-2xl bg-surface-2" />
        <div className="h-16 rounded-2xl bg-surface-2" />
        <div className="h-16 rounded-2xl bg-surface-2" />
        <div className="h-16 rounded-2xl bg-surface-2" />
      </div>
      <div className="mt-4 h-36 animate-pulse rounded-2xl bg-surface-2" />
      <div className="mt-4 h-28 animate-pulse rounded-2xl bg-surface-2" />
      <p className="sr-only" role="status">
        Loading player
      </p>
      <h2 id="player-sheet-title" className="sr-only">
        Loading player
      </h2>
    </div>
  );
}

/* ───────────────────────────── the loaded sheet ───────────────────────────── */

const TERM_LABEL: Record<string, string> = {
  minutes: 'Appearance',
  goals_scored: 'Goals',
  assists: 'Assists',
  clean_sheets: 'Clean sheet',
  goals_conceded: 'Goals conceded',
  saves: 'Saves',
  bonus: 'Bonus',
  defensive_contribution: 'Defensive contribution',
};

function termLabel(key: string): string {
  return TERM_LABEL[key] ?? humanize(key).replace(/^./, (c) => c.toUpperCase());
}

function Detail({
  detail: d,
  meta,
  onClose,
}: {
  detail: PlayerDetail;
  meta: ApiResponseMeta | null;
  onClose: () => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  // A second player opened into the same dialog inherits the first one's scroll position otherwise.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [d.playerId]);
  const next = d.projections[0] ?? null;
  const horizonTotal = d.projections.reduce((s, p) => s + p.expectedPoints, 0);
  const flagged = isFlagged(d.status);

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-line px-5 pb-4 pt-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PositionChip position={d.position} />
            <h2
              id="player-sheet-title"
              className="truncate text-xl font-semibold tracking-tight text-ink"
            >
              {d.webName}
            </h2>
            <StatusBadge
              status={d.status}
              news={d.news}
              chance={d.chanceOfPlayingNextRound}
            />
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-3">
            {d.fullName !== d.webName && <>{d.fullName} · </>}
            {d.teamName} · <span className="tabular-nums">{money(d.nowCost)}</span>
          </p>
        </div>
        <CloseButton onClick={onClose} />
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
        {flagged && d.news && (
          <p className="mt-4 rounded-2xl border border-[color-mix(in_oklab,var(--warn)_35%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] px-3.5 py-2.5 text-xs leading-5 text-ink-2">
            {d.news}
          </p>
        )}

        {/* The four numbers a manager reads first. */}
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile
            label={next ? `xP · GW ${next.gameweekId}` : 'xP next GW'}
            value={next ? points(next.expectedPoints) : '—'}
            hint={next ? 'projected points' : 'no projection'}
            emphasis
          />
          <Tile
            label="Plays"
            value={next ? percent(next.playProbability) : '—'}
            hint="chance to feature"
          />
          <Tile
            label="Minutes"
            value={next ? next.expectedMinutes.toFixed(0) : '—'}
            hint="expected"
          />
          <Tile
            label={`Next ${d.horizonGameweekIds.length || 5} GWs`}
            value={d.projections.length > 0 ? points(horizonTotal) : '—'}
            hint={
              d.projections.length > 0
                ? `GW ${d.horizonGameweekIds[0]}–${d.horizonGameweekIds[d.horizonGameweekIds.length - 1]}, undecayed`
                : 'no projection'
            }
          />
        </dl>

        <Section
          title="The run of fixtures"
          subtitle="Projected points per gameweek, with each opponent and FPL’s difficulty for this side of the match."
        >
          <Horizon detail={d} />
        </Section>

        {next && (
          <Section
            title={`Why ${points(next.expectedPoints)} this gameweek`}
            subtitle="The model’s own terms, largest first. The appearance term already prices the chance he does not play."
          >
            <Terms projection={next} />
          </Section>
        )}

        {next && next.sd !== null && (
          <Section
            title="How wide the range is"
            subtitle="Two players with the same projection are not the same bet."
          >
            <dl className="grid grid-cols-3 gap-2">
              <Tile
                label="Blank"
                value={next.pBlank === null ? '—' : percent(next.pBlank)}
                hint="2 points or fewer"
              />
              <Tile
                label="Haul"
                value={next.pHaul === null ? '—' : percent(next.pHaul)}
                hint="10 or more"
              />
              <Tile label="Spread" value={`±${next.sd.toFixed(1)}`} hint="one standard deviation" />
            </dl>
          </Section>
        )}

        <Section
          title="Recent matches"
          subtitle={
            d.recent.length === 0
              ? 'No finished match on record yet this season.'
              : 'What actually happened, newest first.'
          }
        >
          {d.recent.length > 0 && <Recent rows={d.recent} />}
        </Section>

        <Section title="The facts around him">
          <Facts detail={d} />
        </Section>

        <Provenance
          className="mt-5"
          meta={meta}
          modelVersion={d.modelVersion}
          gameweekId={d.horizonGameweekIds[0] ?? null}
        />
      </div>
    </>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[11px] leading-4 text-ink-3">{subtitle}</p>}
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function Tile({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cx('rounded-2xl border border-line p-3', emphasis ? 'bg-surface-2' : 'bg-surface')}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">{label}</dt>
      <dd className={cx('mt-0.5 font-semibold tabular-nums tracking-tight text-ink', emphasis ? 'text-2xl' : 'text-lg')}>
        {value}
      </dd>
      {hint && <p className="text-[10px] text-ink-3">{hint}</p>}
    </div>
  );
}

/** One column per horizon gameweek: the xP as a bar, then the fixtures underneath it. */
function Horizon({ detail: d }: { detail: PlayerDetail }) {
  const byGw = new Map(d.projections.map((p) => [p.gameweekId, p]));
  const gws = d.horizonGameweekIds.length > 0 ? d.horizonGameweekIds : d.projections.map((p) => p.gameweekId);
  const max = Math.max(1, ...d.projections.map((p) => p.expectedPoints));

  if (gws.length === 0) {
    return <p className="text-xs text-ink-3">No upcoming gameweek to project.</p>;
  }

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${gws.length}, minmax(0, 1fr))` }}>
      {gws.map((gw) => {
        const p = byGw.get(gw);
        return (
          <div key={gw} className="flex flex-col items-stretch rounded-xl border border-line bg-surface p-1.5">
            <div className="text-center text-xs font-semibold tabular-nums text-ink">
              {p ? points(p.expectedPoints) : <span className="text-ink-3">—</span>}
            </div>
            <div className="mx-auto mt-1 flex h-14 w-3 items-end overflow-hidden rounded-full bg-surface-3">
              <span
                aria-hidden
                className="bar-fill-v block w-full rounded-full bg-ink-2"
                style={{ '--fill': p ? p.expectedPoints / max : 0 } as CSSProperties}
              />
            </div>
            <div className="mt-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-ink-3">
              GW {gw}
            </div>
            <div className="mt-1 flex flex-col items-center gap-1">
              {p && p.fixtures.length === 0 && (
                <span className="text-[10px] text-ink-3" title="No fixture this gameweek">blank</span>
              )}
              {!p && <span className="text-[10px] text-ink-3">no proj.</span>}
              {p?.fixtures.map((f, i) => (
                <span
                  key={`${f.opponentShortName}-${i}`}
                  className="inline-flex items-center gap-1 text-[11px]"
                  title={f.kickoffTime ? localKickoff(f.kickoffTime) : 'Kickoff not scheduled'}
                >
                  <span className="font-semibold text-ink">{f.opponentShortName}</span>
                  <span className="text-ink-3">{f.isHome ? 'H' : 'A'}</span>
                  <DifficultyChip difficulty={f.difficulty} />
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The next gameweek's terms as signed bars. `fixtures` is a multiplier, not points, and is footed. */
function Terms({ projection }: { projection: PlayerProjection }) {
  const entries = Object.entries(projection.components).filter(([k]) => k !== 'fixtures');
  const shown = entries
    .filter(([, v]) => Math.abs(v) >= 0.005)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const max = Math.max(0.01, ...shown.map(([, v]) => Math.abs(v)));
  const factor = projection.components.fixtures;

  if (shown.length === 0) {
    return <p className="text-xs text-ink-3">The model recorded no terms for this projection.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {shown.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(0,9rem)_1fr_3.25rem] items-center gap-2 text-xs">
          <span className="truncate text-ink-2">{termLabel(key)}</span>
          <span aria-hidden className="block h-2 w-full overflow-hidden rounded-full bg-surface-3">
            <span
              className={cx('bar-fill block h-full rounded-full', value < 0 ? 'bg-bad' : 'bg-ink-2')}
              style={{ '--fill': Math.abs(value) / max } as CSSProperties}
            />
          </span>
          <span className={cx('text-right font-semibold tabular-nums', value < 0 ? 'text-bad' : 'text-ink')}>
            {term(value)}
          </span>
        </div>
      ))}
      {/* A factor of exactly 1 is the model saying nothing about the fixture, and is not shown. */}
      {typeof factor === 'number' && Math.abs(factor - 1) >= 0.005 && (
        <p className="mt-1 text-[11px] text-ink-3">
          Fixture factor{' '}
          <span className="font-semibold tabular-nums text-ink-2">×{factor.toFixed(2)}</span>
          {' — '}
          {factor > 1 ? 'an easier match than average' : 'a harder match than average'}
          , already inside the terms above.
        </p>
      )}
    </div>
  );
}

function Recent({ rows }: { rows: PlayerRecentGameweek[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-surface-2 text-[10px] uppercase tracking-wider text-ink-3">
            <th className="px-2.5 py-1.5 font-semibold">GW</th>
            <th className="px-2 py-1.5 font-semibold">Opp</th>
            <th className="px-2 py-1.5 text-right font-semibold">Min</th>
            <th className="px-2 py-1.5 text-right font-semibold">Pts</th>
            <th className="px-2 py-1.5 text-right font-semibold">G</th>
            <th className="px-2 py-1.5 text-right font-semibold">A</th>
            <th className="px-2 py-1.5 text-right font-semibold"><abbr title="Clean sheet">CS</abbr></th>
            <th className="px-2 py-1.5 text-right font-semibold"><abbr title="Bonus">B</abbr></th>
            <th className="hidden px-2 py-1.5 text-right font-semibold sm:table-cell"><abbr title="Expected goals">xG</abbr></th>
            <th className="hidden px-2.5 py-1.5 text-right font-semibold sm:table-cell"><abbr title="Expected assists">xA</abbr></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.gameweekId}-${r.opponentShortName}-${i}`} className="border-b border-line last:border-0">
              <td className="px-2.5 py-1.5 tabular-nums text-ink-3">{r.gameweekId}</td>
              <td className="px-2 py-1.5 font-medium text-ink">
                {r.opponentShortName} <span className="font-normal text-ink-3">{r.wasHome ? 'H' : 'A'}</span>
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-ink-2">{r.minutes}</td>
              <td className={cx('px-2 py-1.5 text-right font-semibold tabular-nums', r.points >= 10 ? 'text-good' : r.points <= 2 ? 'text-ink-3' : 'text-ink')}>
                {r.points}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-ink-2">{r.goals || '·'}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-ink-2">{r.assists || '·'}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-ink-2">{r.cleanSheets ? '✓' : '·'}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-ink-2">{r.bonus || '·'}</td>
              <td className="hidden px-2 py-1.5 text-right tabular-nums text-ink-2 sm:table-cell">{r.expectedGoals.toFixed(2)}</td>
              <td className="hidden px-2.5 py-1.5 text-right tabular-nums text-ink-2 sm:table-cell">{r.expectedAssists.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Facts({ detail: d }: { detail: PlayerDetail }) {
  const t = d.seasonTotals;
  const setPieces = [
    d.penaltiesOrder !== null && `penalties #${d.penaltiesOrder}`,
    d.directFreekicksOrder !== null && `free kicks #${d.directFreekicksOrder}`,
    d.cornersOrder !== null && `corners #${d.cornersOrder}`,
  ].filter(Boolean) as string[];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-3">
      <Fact label="Owned by" value={d.selectedByPercent === null ? '—' : `${d.selectedByPercent.toFixed(1)}%`} hint="of FPL managers" />
      <Fact label="Form" value={d.form === null ? '—' : d.form.toFixed(1)} hint="FPL, last 30 days" />
      <Fact label="Points per game" value={d.pointsPerGame === null ? '—' : d.pointsPerGame.toFixed(1)} hint="FPL, this season" />
      <Fact label="Season" value={t ? `${t.points} pts` : '—'} hint={t ? `${t.appearances} match${t.appearances === 1 ? '' : 'es'} · ${t.goals}G ${t.assists}A` : 'no match yet'} />
      <Fact label="Minutes" value={`${d.seasonMinutes}′`} hint={`${d.seasonStarts} start${d.seasonStarts === 1 ? '' : 's'}`} />
      <Fact label="Set pieces" value={setPieces.length > 0 ? setPieces.join(' · ') : 'none listed'} />
      <Fact
        label="Price"
        value={d.priceChangeSinceTracked === null ? money(d.nowCost) : `${money(d.nowCost)} (${moneyDelta(d.priceChangeSinceTracked)})`}
        hint={d.priceTrackedSince ? `since ${localDate(d.priceTrackedSince)}` : undefined}
      />
      {t && (
        <Fact label="xG · xA" value={`${t.expectedGoals.toFixed(2)} · ${t.expectedAssists.toFixed(2)}`} hint="season, FPL’s figures" />
      )}
      {d.chanceOfPlayingNextRound !== null && (
        <Fact label="FPL says" value={`${d.chanceOfPlayingNextRound}% to play`} hint="official chance" />
      )}
    </dl>
  );
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">{label}</dt>
      <dd className="truncate font-semibold tabular-nums text-ink">{value}</dd>
      {hint && <p className="truncate text-[10px] text-ink-3">{hint}</p>}
    </div>
  );
}
