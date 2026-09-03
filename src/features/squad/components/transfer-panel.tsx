import { Badge, PositionChip } from '@/components/ui/badge';
import { Card, SectionHeading } from '@/components/ui/card';
import { Note } from '@/components/ui/note';
import { Stat } from '@/components/ui/stat';
import { delta, money, points } from '@/lib/format';
import type { PlannedMove, TransferPlan } from '../api/squad.api';
import { PlayerTrigger } from './player-sheet/player-trigger';

/**
 * What to do with the squad you already have (B-008).
 *
 * The app could say "here is a better fifteen" long before it could say "here is the move". The gap
 * between those two is money — a player sells for what you paid plus half the rise, not for his
 * market price — and time, because you get one free transfer a week and every extra one costs four
 * points. This panel is the second sentence.
 *
 * **Three things are rendered as claims about our own certainty, not as decoration.**
 *
 * 1. **Where each sell value came from.** FPL publishes neither purchase nor selling price, so every
 *    one of these is reconstructed. A number reconstructed from the manager's own transfer log is
 *    exact; one that fell back to the market price overstates the budget, and the panel says which.
 * 2. **Whether the free-transfer count is complete.** It is a replay of the manager's gameweek
 *    history. A gap makes it a lower bound.
 * 3. **That chips are windows.** A chip is unspendable once used, so the model names the gameweek the
 *    calendar argues for and stops. Most weeks the honest answer is "nothing here argues for one",
 *    and that is rendered as an answer rather than hidden as an absence.
 */
export function TransferPanel({ plan }: { plan: TransferPlan }) {
  const holding = plan.moves.length === 0;

  return (
    <Card as="section">
      <SectionHeading
        title="What to do with this squad"
        subtitle={
          holding
            ? 'The model would hold. Holding is always available to it, so this is a decision and not a missing answer.'
            : `${plan.moves.length} transfer${plan.moves.length === 1 ? '' : 's'} over gameweeks ${plan.horizonGameweekIds[0]}–${plan.horizonGameweekIds[plan.horizonGameweekIds.length - 1]}, priced at what selling actually returns.`
        }
        aside={
          <span title="Free transfers in hand, replayed from this manager's own gameweek history">
            {plan.freeTransfers} free
            {plan.freeTransfersReconstructed ? '' : ' (at least)'}
          </span>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="Net gain"
          value={delta(plan.netGainEp)}
          unit="pts"
          hint="Over the horizon, hit already subtracted"
          tone={plan.netGainEp > 0 ? 'good' : 'neutral'}
        />
        <Stat
          label="Hits"
          value={plan.hits}
          hint={
            plan.hits === 0
              ? 'Every move is free'
              : `−${plan.hitCost} points, and taken anyway`
          }
          tone={plan.hits > 0 ? 'warn' : 'neutral'}
        />
        <Stat label="Bank" value={money(plan.bank)} hint="Before any move" />
        <Stat
          label="After"
          value={points(plan.plannedEp)}
          unit="pts"
          hint={`From ${points(plan.currentEp)} today`}
        />
      </div>

      {!holding && (
        <ul className="mt-4 flex flex-col gap-2">
          {plan.moves.map((move) => (
            <MoveRow key={`${move.out.playerId}-${move.in.playerId}`} move={move} />
          ))}
        </ul>
      )}

      <div className="mt-5">
        <SectionHeading
          level={3}
          title="Chips"
          subtitle="A window, never a decision — a chip is unspendable once used, and no model here can price the week you would then never get to use it in."
        />
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {plan.chips.map((chip) => (
            <li
              key={chip.chip}
              className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs"
            >
              <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                {chip.label}
                {chip.spent ? (
                  <Badge tone="neutral">used</Badge>
                ) : chip.gameweekId !== null ? (
                  <Badge tone="accent">GW {chip.gameweekId}</Badge>
                ) : (
                  <Badge tone="neutral">no window yet</Badge>
                )}
              </p>
              <p className="mt-1 leading-5 text-ink-3">{chip.reason}</p>
            </li>
          ))}
        </ul>
      </div>

      {plan.sellValueUnknown.length > 0 && (
        <Note title="One number here is weaker than the others" tone="warn" className="mt-4">
          Sell value could not be reconstructed for{' '}
          {plan.sellValueUnknown.join(', ')}, so the budget used the market
          price. That overstates what you would get for a player whose price has
          risen — the direction that produces a plan you cannot afford.
        </Note>
      )}

      <Note title="What this plan is not" tone="limit" className="mt-4">
        <ul className="flex flex-col gap-1">
          {plan.caveats.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Note>
    </Card>
  );
}

/**
 * One move, read left to right as a sentence: who goes, what that returns, who arrives, what it buys.
 *
 * The sell value is shown beside the market price rather than instead of it, because the difference
 * between them IS the constraint — a reader who only sees one number cannot tell why a swap that
 * looks affordable is not.
 */
function MoveRow({ move }: { move: PlannedMove }) {
  const { out, in: incoming } = move;
  const sellsBelowMarket =
    out.sellValue !== null && out.sellValue < out.nowCost;

  return (
    <li className="rounded-2xl border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <PositionChip position={out.position} />
          <PlayerTrigger playerId={out.playerId} name={out.webName} className="gap-1.5 hover:underline underline-offset-2">
            <span className="font-medium text-ink line-through decoration-ink-3/60">
              {out.webName}
            </span>
            <span className="text-xs text-ink-3">{out.teamShortName}</span>
          </PlayerTrigger>
          <span className="text-ink-3">→</span>
          <PlayerTrigger playerId={incoming.playerId} name={incoming.webName} className="gap-1.5 hover:underline underline-offset-2">
            <span className="font-semibold text-ink">{incoming.webName}</span>
            <span className="text-xs text-ink-3">{incoming.teamShortName}</span>
          </PlayerTrigger>
        </div>
        <span
          className="text-sm font-semibold text-[var(--good)]"
          title="Horizon expected points this move adds, before any hit"
        >
          {delta(move.gainEp)}
        </span>
      </div>

      <p className="mt-1.5 text-xs leading-5 text-ink-3">
        Sells for{' '}
        <span className="text-ink-2">
          {out.sellValue === null ? '—' : money(out.sellValue)}
        </span>
        {sellsBelowMarket && (
          <>
            {' '}
            — {money(out.nowCost)} on the market, and you keep half the rise
          </>
        )}
        {out.sellValueSource === 'unknown' && (
          <> — reconstructed price unavailable, so the market price was used</>
        )}
        . Buys {incoming.webName} at {money(incoming.nowCost)},{' '}
        {points(incoming.epHorizon)} against {points(out.epHorizon)}.
      </p>
    </li>
  );
}
