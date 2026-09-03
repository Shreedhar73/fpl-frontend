import { Badge, PositionChip } from '@/components/ui/badge';
import { BlankTag, FixtureTag } from '@/components/ui/fixture-tag';
import { Note } from '@/components/ui/note';
import { getPlayerDetail } from '@/features/squad/api/players.api';
import type { PlannedMove } from '@/features/squad/api/squad.api';
import { PlayerTrigger } from '@/features/squad/components/player-sheet/player-trigger';
import { cx, delta, money, points } from '@/lib/format';
import type { BoardPlayer, TeamData } from '../load-team';
import { FreeTransfers } from './free-transfers';
import { Eyebrow, Why } from './why';

/**
 * The plan as before/after: a summary strip, one card per move with both players' runs, the chips
 * as windows, the best-15 set difference, and the free-transfer stepper where the number is the
 * reader's to state (a built 15). The incoming player's run is not on the advice — he is not in
 * the 15 — so it is fetched here, on the server, one call per move.
 */
export async function PlanTab({ team }: { team: TeamData }) {
  const { advice, plan, players, basePath, query, source } = team;
  const c = advice.comparison;
  const gws = advice.horizonGameweekIds;

  if (!plan) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-3">
          <Eyebrow>Transfers</Eyebrow>
          <p className="text-sm text-ink-2">
            {source.kind === 'recommended'
              ? 'This 15 is the one the optimizer would buy at today’s prices. There is nothing to plan from.'
              : (team.planError ?? 'The plan could not be loaded.')}
          </p>
        </div>
        <BestFifteen team={team} />
      </div>
    );
  }

  const byId = new Map(players.map((p) => [p.playerId, p]));
  const incoming = await Promise.all(
    plan.moves.map(async (m) => {
      try {
        return (await getPlayerDetail(m.in.playerId)).data;
      } catch {
        return null;
      }
    }),
  );
  const last = plan.horizonGameweekIds[plan.horizonGameweekIds.length - 1];

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
      <div className="flex flex-col gap-5">
        <dl className="hairline-x grid grid-cols-2 border-y border-line-strong border-b-line sm:grid-cols-5">
          <Cell label="Net gain" value={delta(plan.netGainEp)} tone={plan.netGainEp > 0 ? 'good' : 'neutral'} hint={`GW ${plan.horizonGameweekIds[0]}–${last}, hits subtracted`} first />
          <Cell label="Moves" value={String(plan.moves.length)} hint={plan.moves.length === 0 ? 'the model would hold' : 'this week'} />
          <Cell label="Hits" value={String(plan.hits)} tone={plan.hits > 0 ? 'warn' : 'neutral'} hint={plan.hits === 0 ? 'every move is free' : `−${plan.hitCost} points, taken anyway`} />
          <Cell label="Free transfers" value={String(plan.freeTransfers)} hint={plan.freeTransfersSource === 'stated' ? 'as you stated' : plan.freeTransfersReconstructed ? 'replayed from history' : 'replayed, at least'} />
          <Cell label="After" value={points(plan.plannedEp)} hint={`from ${points(plan.currentEp)} today`} />
        </dl>

        {plan.moves.length === 0 ? (
          <p className="text-sm leading-6 text-ink-2">
            The model would hold. Holding is always available to it, so this is a decision rather
            than a missing answer: no swap under {plan.freeTransfers} free transfer{plan.freeTransfers === 1 ? '' : 's'} beats keeping the 15 over GW {plan.horizonGameweekIds[0]}–{last}.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {plan.moves.map((m, i) => (
              <MoveCard key={`${m.out.playerId}-${m.in.playerId}`} move={m} out={byId.get(m.out.playerId)} inRun={incoming[i]?.projections.map((p) => ({ gameweekId: p.gameweekId, expectedPoints: p.expectedPoints, fixtures: p.fixtures })) ?? null} gws={gws} basePath={basePath} query={query} />
            ))}
          </ul>
        )}

        {source.kind === 'built' && <FreeTransfers current={plan.freeTransfers} />}

        <details className="group rounded-[10px] border border-dashed border-line-strong px-3.5 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <Eyebrow>What this plan is not</Eyebrow>
            <span className="text-ink-3 transition-transform group-open:rotate-180">
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </span>
          </summary>
          <ul className="mt-2 flex flex-col gap-1 text-xs leading-5 text-ink-2">
            {plan.caveats.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {plan.sellValueUnknown.length > 0 && (
            <Note title="One number here is weaker than the others" tone="warn" className="mt-3">
              Sell value could not be reconstructed for {plan.sellValueUnknown.join(', ')}, so the budget used the market price.
            </Note>
          )}
        </details>
      </div>

      <div className="flex flex-col gap-6">
        <div id="chips" className="flex flex-col gap-2.5 scroll-mt-24">
          <Eyebrow>Chips · windows, not decisions</Eyebrow>
          <ul className="grid grid-cols-2 gap-2">
            {plan.chips.map((chip) => (
              <li key={chip.chip} className="flex flex-col gap-1 rounded-xl border border-line bg-surface px-3.5 py-3">
                <span className="text-[13px] font-semibold text-ink">{chip.label}</span>
                <span className={cx('num text-xs font-bold', chip.spent ? 'text-ink-3' : chip.gameweekId !== null ? 'text-good' : chip.chip === 'wildcard' && c.horizonGap >= 6 ? 'text-warn' : 'text-ink-3')}>
                  {chip.spent ? 'used' : chip.gameweekId !== null ? `gameweek ${chip.gameweekId}` : 'no window'}
                </span>
                <span className="text-[11.5px] leading-[1.4] text-ink-3">{chip.reason}</span>
              </li>
            ))}
          </ul>
        </div>
        <BestFifteen team={team} />
      </div>
    </div>
  );
}

interface Run {
  gameweekId: number;
  expectedPoints: number | null;
  fixtures: { opponentShortName: string; isHome: boolean; difficulty: number }[];
}

function MoveCard({
  move,
  out,
  inRun,
  gws,
}: {
  move: PlannedMove;
  out: BoardPlayer | undefined;
  inRun: Run[] | null;
  gws: number[];
  basePath: string;
  query: string;
}) {
  const outRun: Run[] = out ? out.horizon : [];
  const sellsBelowMarket = move.out.sellValue !== null && move.out.sellValue < move.out.nowCost;
  const max = Math.max(1, ...outRun.map((r) => r.expectedPoints ?? 0), ...(inRun ?? []).map((r) => r.expectedPoints ?? 0));

  return (
    <li className="overflow-hidden rounded-[14px] border border-line bg-surface">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)]">
        <Side
          eyebrow={`Out · sells ${move.out.sellValue === null ? '—' : money(move.out.sellValue)}`}
          name={move.out.webName}
          playerId={move.out.playerId}
          club={move.out.teamShortName}
          position={move.out.position}
          run={outRun}
          total={move.out.epHorizon}
          gws={gws}
          max={max}
          tone="out"
        />
        <div className="grid place-items-center border-y border-line bg-surface-2 py-1.5 text-ink-3 sm:border-x sm:border-y-0">
          <svg aria-hidden viewBox="0 0 24 24" className="size-4 max-sm:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </div>
        <Side
          eyebrow={`In · costs ${money(move.in.nowCost)}`}
          name={move.in.webName}
          playerId={move.in.playerId}
          club={move.in.teamShortName}
          position={move.in.position}
          run={inRun}
          total={move.in.epHorizon}
          gws={gws}
          max={max}
          tone="in"
          gain={move.gainEp}
        />
      </div>
      <p className="border-t border-line px-4 py-2 text-xs text-ink-3">
        {move.out.sellValueSource === 'market-price'
          ? 'Sell value is today’s market price, exact: this fifteen was never bought.'
          : move.out.sellValueSource === 'unknown'
            ? 'Sell value could not be reconstructed, so the market price was used — it overstates the budget.'
            : sellsBelowMarket
              ? `Sell value is exact, from your transfer log — ${money(move.out.nowCost)} on the market, and you keep half the rise.`
              : 'Sell value is exact, from your transfer log.'}
      </p>
    </li>
  );
}

function Side({
  eyebrow, name, playerId, club, position, run, total, gws, max, tone, gain,
}: {
  eyebrow: string;
  name: string;
  playerId: string;
  club: string;
  position: BoardPlayer['position'];
  run: Run[] | null;
  total: number;
  gws: number[];
  max: number;
  tone: 'in' | 'out';
  gain?: number;
}) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <Eyebrow>{eyebrow}</Eyebrow>
        {gain !== undefined ? (
          <span className="num text-[15px] font-extrabold text-good">{delta(gain)}</span>
        ) : (
          <PositionChip position={position} />
        )}
      </div>
      <PlayerTrigger playerId={playerId} name={name} className="gap-2 hover:underline underline-offset-4">
        <span className="num text-[22px] font-extrabold leading-none text-ink">{name}</span>
        <span className="text-xs text-ink-3">{club}</span>
      </PlayerTrigger>
      <div className="flex items-end justify-between gap-3">
        <div className="flex h-7 items-end gap-1">
          {gws.map((gw) => {
            const r = run?.find((x) => x.gameweekId === gw);
            const v = r?.expectedPoints ?? null;
            return (
              <span
                key={gw}
                title={v === null ? `GW ${gw}: no projection` : `GW ${gw}: ${points(v)} xP`}
                className={cx('w-[22px] rounded-[3px]', v === null ? 'border border-dashed border-line-strong' : tone === 'in' ? 'bg-good' : 'bg-ink-2')}
                style={{ height: v === null ? 6 : Math.max(4, Math.round((v / max) * 28)) }}
              />
            );
          })}
        </div>
        <span className={cx('num text-lg font-bold', tone === 'in' ? 'text-ink' : 'text-ink-2')}>{points(total)}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {run === null ? (
          <span className="text-[11px] text-ink-3">run not available</span>
        ) : (
          gws.map((gw) => {
            const r = run.find((x) => x.gameweekId === gw);
            if (!r || r.fixtures.length === 0) return <BlankTag key={gw} size="sm" />;
            return r.fixtures.map((f, i) => <FixtureTag key={`${gw}-${i}`} opponent={f.opponentShortName} isHome={f.isHome} difficulty={f.difficulty} size="sm" />);
          })
        )}
      </div>
    </div>
  );
}

function Cell({ label, value, hint, tone = 'neutral', first = false }: { label: string; value: string; hint?: string; tone?: 'neutral' | 'good' | 'warn'; first?: boolean }) {
  return (
    <div className={cx('flex flex-col gap-0.5 py-4', !first && 'pl-4')}>
      <dt><Eyebrow>{label}</Eyebrow></dt>
      <dd className={cx('num text-[26px] font-extrabold leading-[1.1]', tone === 'good' ? 'text-good' : tone === 'warn' ? 'text-warn' : 'text-ink')}>{value}</dd>
      {hint && <span className="text-[11.5px] text-ink-3">{hint}</span>}
    </div>
  );
}

/** The best-15 set difference — unpriced, and labelled as such. */
export function BestFifteen({ team }: { team: TeamData }) {
  const { advice, basePath, query } = team;
  const c = advice.comparison;
  if (c.horizonGap < 0.05 && c.optimalHasThatYouDoNot.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <Eyebrow>Best 15</Eyebrow>
          <Badge tone="good">no gap</Badge>
        </div>
        <p className="text-xs leading-5 text-ink-2">
          This is the best legal 15 at today&apos;s prices: {points(c.squadHorizonEp)} over GW {advice.horizonGameweekIds[0]}–{advice.horizonGameweekIds[advice.horizonGameweekIds.length - 1]} in the {c.formation} shape.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <Eyebrow>Best 15 · what the plan does not close</Eyebrow>
        <span className={cx('num text-[15px] font-extrabold', c.horizonGap >= 6 ? 'text-warn' : 'text-ink-2')}>{delta(-c.horizonGap)}</span>
      </div>
      <ul className="flex flex-col">
        {c.optimalHasThatYouDoNot.slice(0, 6).map((p) => (
          <li key={p.playerId} className="flex items-center justify-between gap-2 border-b border-line py-1.5 text-[12.5px]">
            <PlayerTrigger playerId={p.playerId} name={p.webName} className="min-w-0 gap-2 hover:underline underline-offset-2">
              <PositionChip position={p.position} />
              <span className="truncate font-medium text-ink">{p.webName}</span>
              <span className="text-ink-3">{p.teamShortName} · {money(p.nowCost)}</span>
            </PlayerTrigger>
            <span className="num font-semibold text-ink">{points(p.epHorizon)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11.5px] text-ink-3">
        Optimizer has, you do not. A set difference, unpriced — the plan above prices the moves. Its shape is {c.optimalFormation}; yours {c.formation}. <Why href={`${basePath}/squad${query}`}>Squad</Why>
      </p>
    </div>
  );
}
