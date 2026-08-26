import { Badge, PositionChip } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Card, SectionHeading } from '@/components/ui/card';
import { Note } from '@/components/ui/note';
import { Stat } from '@/components/ui/stat';
import { delta, money, percent, points } from '@/lib/format';
import type { Advice, AdvicePlayer, SquadDifference } from '../api/squad.api';
import { PlayerTable } from './player-table';

/**
 * What the model would do with this squad, and how far the squad is from the best legal one.
 *
 * Ordered by the question a visitor actually arrived with: who do I captain, is my XI the right XI,
 * which 15 would have been better, and what does this not know. The captain call is the hero
 * because it is the one decision worth two players' worth of points.
 *
 * The transfer affordance is deliberately disabled and labelled. Transfers need sell value, which
 * no public FPL endpoint exposes, and a hit calculation — that is B-008. A plausible-looking
 * suggestion built from a subtraction would be worse than an honest gap.
 */

/**
 * How far behind is "behind". The bands are a reading aid, not a model output: a gap under two
 * points over a whole horizon is inside the model's own error, and past six it is a squad problem
 * rather than a line-up one.
 */
function gapTone(gap: number): 'good' | 'warn' | 'bad' {
  if (gap < 2) return 'good';
  if (gap < 6) return 'warn';
  return 'bad';
}

export function CaptainCard({ advice }: { advice: Advice }) {
  const captain = advice.captain;
  const vice = advice.viceCaptain;

  if (!captain) {
    return (
      <Card>
        <SectionHeading
          title="No captain to recommend"
          subtitle="The model has no projection for anyone in this squad this gameweek."
        />
      </Card>
    );
  }

  const evidence = captain.evidence;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
            Captain · gameweek {advice.gameweekId}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              {captain.webName}
            </h2>
            <PositionChip position={captain.position} />
            <span className="text-xs text-ink-3">
              {captain.teamShortName} · {money(captain.nowCost)}
            </span>
          </div>
          {evidence && (
            <p className="mt-2 text-xs leading-5 text-ink-2">
              {percent(evidence.playProbability)} to play,{' '}
              {evidence.expectedMinutes.toFixed(0)} minutes expected — the
              largest projection in the squad, which is the whole of the case
              for the armband.
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink">
            {points(captain.epNextGw * 2)}
          </p>
          <p className="text-[11px] text-ink-3">
            projected with the double
            <br />
            <span className="tabular-nums">
              {points(captain.epNextGw)} × 2
            </span>
          </p>
        </div>
      </div>

      {vice && (
        <p className="mt-4 border-t border-line pt-3 text-xs text-ink-2">
          <span className="font-medium text-ink">Vice: {vice.webName}</span> —
          takes the armband automatically if {captain.webName} does not start,
          at{' '}
          <span className="tabular-nums">{points(vice.epNextGw)}</span> projected
          before the double.
        </p>
      )}
    </Card>
  );
}

function DifferenceList({
  title,
  players,
  tone,
}: {
  title: string;
  players: SquadDifference[];
  tone: 'in' | 'out';
}) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
        {title}
      </h4>
      <ul className="mt-1.5 flex flex-col gap-1">
        {players.slice(0, 6).map((p) => (
          <li
            key={p.playerId}
            className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-2 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <PositionChip position={p.position} />
              <span className="truncate text-xs font-medium text-ink">
                {p.webName}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-ink-3">
                {p.teamShortName} · {money(p.nowCost)}
              </span>
            </span>
            <span
              className={`shrink-0 text-xs font-semibold tabular-nums ${
                tone === 'in' ? 'text-good' : 'text-ink-3'
              }`}
            >
              {points(p.epHorizon)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The four numbers that answer "is this squad any good". Split out from the panel so the squad
 * view can stand them beside the pitch, where the comparison is immediate, while the builder keeps
 * them stacked.
 */
export function AdviceStats({
  advice,
  className = 'grid grid-cols-2 gap-2 lg:grid-cols-4',
}: {
  advice: Advice;
  className?: string;
}) {
  const c = advice.comparison;
  const horizon = advice.horizonGameweekIds;

  return (
    <dl className={className}>
      <Stat
          label="Your XI this gameweek"
          value={points(c.xiNextGwEp)}
          unit="pts"
          hint="Projected, captain doubled"
        />
        <Stat
          label="Best XI would score"
          value={points(c.optimalXiNextGwEp)}
          unit="pts"
          hint={
            c.xiNextGwGap < 0.05
              ? 'Your XI is already that XI'
              : `You are ${delta(-c.xiNextGwGap)} on the gameweek`
          }
        />
        <Stat
          label="Your 15 over the horizon"
          value={points(c.squadHorizonEp)}
          unit="pts"
          hint={
            horizon.length > 0
              ? `Gameweeks ${horizon[0]}–${horizon[horizon.length - 1]}`
              : undefined
          }
        />
        <Stat
          label="Behind the best 15"
          value={points(c.horizonGap)}
          unit="pts"
          tone={gapTone(c.horizonGap)}
          hint={`Across ${horizon.length} gameweeks`}
        />
    </dl>
  );
}

/** The set difference against the optimal 15, and the honest label on what it is not. */
export function ComparisonCard({ advice }: { advice: Advice }) {
  const c = advice.comparison;
  const horizon = advice.horizonGameweekIds;

  // The recommended squad *is* the optimal squad, so the ledger below would be two empty columns
  // under a heading that implies otherwise. Say what the empty comparison means instead.
  const isOptimal =
    c.horizonGap < 0.05 && c.optimalHasThatYouDoNot.length === 0;

  if (isOptimal) {
    return (
      <Card>
        <SectionHeading
          title="This is the best legal 15"
          subtitle={`Nothing buildable at today's prices projects higher over gameweeks ${horizon.join(', ')}.`}
          aside={<Badge tone="good">no gap</Badge>}
        />
        <p className="mt-2 text-xs leading-5 text-ink-2">
          The optimizer solved for this squad, so there is nothing to compare it
          against. It projects {points(c.squadHorizonEp)} points in the{' '}
          {c.formation} shape. What it cannot know is on the list at the bottom
          of this page.
        </p>
      </Card>
    );
  }

  return (
    <Card>
        <SectionHeading
          title="Against the best legal 15"
          subtitle={`Your shape is ${c.formation}; the optimal squad plays ${c.optimalFormation}.`}
          aside={
            <Badge tone={gapTone(c.horizonGap)}>
              {delta(-c.horizonGap)} over the horizon
            </Badge>
          }
        />

        <p className="mt-2 text-xs leading-5 text-ink-2">
          Your 15 project {points(c.squadHorizonEp)} points across gameweeks{' '}
          {horizon.join(', ')}. The best legal 15 buildable at today&apos;s
          prices projects {points(c.optimalHorizonEp)}. The difference is what a
          perfect wildcard would be worth — not what a transfer is worth.
        </p>

        {c.optimalHasThatYouDoNot.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DifferenceList
              title="In the optimal squad, not in yours"
              players={c.optimalHasThatYouDoNot}
              tone="in"
            />
            <DifferenceList
              title="In yours, not in the optimal squad"
              players={c.youHaveThatOptimalDoesNot}
              tone="out"
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            disabled
            title="Not built yet — see the note beside this button"
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            Plan transfers
          </button>
          <span className="text-[11px] leading-4 text-ink-3">
            Not built yet. The two lists above are a set difference, not a
            transfer plan: they ignore sell value, the free transfer you have,
            and the −4 a second one costs.
          </span>
        </div>
    </Card>
  );
}

/** The 15 with the terms behind each projection. */
export function RosterSection({ players }: { players: AdvicePlayer[] }) {
  return (
    <section aria-label="Squad roster" className="flex flex-col gap-3">
      <SectionHeading
        title="Every player, and why"
        subtitle="Projected points for the coming gameweek and across the horizon, with the terms the projection is made of."
      />
      <PlayerTable players={players} />
    </section>
  );
}

/**
 * The model's own list of what it will not tell you, straight from the payload. It is rendered on
 * every view that renders advice: an unstated limit is indistinguishable from a claim.
 */
export function LimitsNote({ advice }: { advice: Advice }) {
  return (
    <Note title="What this does not answer" tone="limit">
      <ul className="flex flex-col gap-1">
        {advice.notAdvisedOn.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </Note>
  );
}

/**
 * The stacked composition, used where there is no pitch beside it — the builder's result view. The
 * squad view lays the same pieces out in two columns instead.
 */
export function AdvicePanel({
  advice,
  players,
}: {
  advice: Advice;
  players?: AdvicePlayer[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <CaptainCard advice={advice} />
      <AdviceStats advice={advice} />
      <ComparisonCard advice={advice} />
      <RosterSection players={players ?? advice.players} />
      <LimitsNote advice={advice} />
    </div>
  );
}
