import { PositionChip } from '@/components/ui/badge';
import { Card, SectionHeading } from '@/components/ui/card';
import { Note } from '@/components/ui/note';
import { points } from '@/lib/format';
import type { Advice } from '../api/squad.api';
import { PlayerTrigger } from './player-sheet/player-trigger';

/**
 * What the optimizer **refused**, and what it paid for what it kept.
 *
 * Two guards change every recommendation this app shows and, until B-018, neither of them appeared
 * anywhere a user could see. A visitor read that Emersonn was absent and that Palmer did not have
 * the armband, and had no way to learn that both were decisions rather than arithmetic. D-019's rule
 * is that a model number states where it came from; a model *refusal* is a stronger claim than a
 * number and was stating nothing.
 *
 * **The two guards are not the same kind of thing, and this component must not level them.** The
 * appearance floor is a refusal to bet on players the model cannot measure. The fixture-collision
 * penalty was swept over 103 archived gameweeks and did *not* improve realised points — it is on as
 * a policy choice about what we are willing to recommend. Both sentences come out of the payload
 * (`reasoning.*.statement`) rather than being written here, precisely so that a later edit to this
 * file cannot quietly upgrade the second one into the first.
 */
export function ReasoningPanel({ advice }: { advice: Advice }) {
  const reasoning = advice.reasoning;
  if (!reasoning) return null;

  const { appearanceFloor: floor, defenceConcentration: concentration } =
    reasoning;

  return (
    <Card as="section">
      <SectionHeading
        title="What the optimizer would not pick, and what it paid"
        subtitle="Both of these change the squad above. Neither is arithmetic — they are decisions, and they are different kinds of decision."
      />

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <SectionHeading
            level={3}
            title="Not enough football to judge"
            subtitle={`${floor.excluded} of the league sit below ${floor.threshold} Premier League appearances and never entered the pool.`}
            aside={
              floor.costEp === null ? null : (
                <span title="Horizon expected points, measured against the same solve with the floor lifted">
                  cost {points(floor.costEp)}
                </span>
              )
            }
          />

          {floor.wouldHaveMadeTheSquad.length === 0 ? (
            <p className="text-xs leading-5 text-ink-2">
              None of the excluded players would have made this squad anyway, so
              the floor cost this recommendation nothing.
            </p>
          ) : (
            <>
              <p className="text-xs leading-5 text-ink-2">
                These would have been picked without it — the list is not
                everyone below the threshold, which is hundreds long and says
                nothing about this squad.
              </p>
              <ul className="flex flex-col gap-1.5">
                {floor.wouldHaveMadeTheSquad.map((p) => (
                  <li
                    key={p.playerId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs"
                  >
                    <PlayerTrigger playerId={p.playerId} name={p.webName} className="min-w-0 gap-2 hover:underline underline-offset-2">
                      <PositionChip position={p.position} />
                      <span className="truncate font-medium text-ink">
                        {p.webName}
                      </span>
                      <span className="text-ink-3">{p.teamShortName}</span>
                    </PlayerTrigger>
                    <span className="text-ink-3">
                      {p.appearances}{' '}
                      {p.appearances === 1 ? 'appearance' : 'appearances'} ·{' '}
                      <span className="text-ink-2">
                        {points(p.epHorizon)} projected
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <Note title="Why the floor exists" tone="limit">
            {floor.statement}
          </Note>
        </div>

        <div className="flex flex-col gap-3">
          {/*
            This section used to be "Betting against itself" — a charge for owning one of our
            attackers against one of our defenders in the same match. B-028 measured that over three
            archived seasons and it was a HEDGE: holding both sides cut the pair's variance by a
            fifth. What actually concentrates a squad is two of one club's defence, sharing one clean
            sheet, and that is what the backend charges for now (B-029).
          */}
          <SectionHeading
            level={3}
            title="Too much of one defence"
            subtitle={`${concentration.pairsHeld} same-club defensive ${concentration.pairsHeld === 1 ? 'pair is' : 'pairs are'} in this squad; ${concentration.started.length} ${concentration.started.length === 1 ? 'is' : 'are'} on the pitch together.`}
            aside={
              <span title="Horizon expected points charged for starting two of one club's defence together. Holding one on the bench costs nothing here — a benched player carries no exposure.">
                paid {points(concentration.penaltyEp)}
              </span>
            }
          />

          {concentration.started.length === 0 &&
          concentration.benched.length === 0 ? (
            <p className="text-xs leading-5 text-ink-2">
              No two of this squad&rsquo;s defensive players share a club, so it
              paid nothing.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {concentration.started.map((c) => (
                <li
                  key={`started-${c.club}-${c.players.join('-')}`}
                  className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs"
                >
                  <p className="font-medium text-ink">
                    {c.players[0]}{' '}
                    <span className="font-normal text-ink-3">and</span>{' '}
                    {c.players[1]}
                  </p>
                  <p className="mt-0.5 text-ink-3">
                    {c.club} &middot; both starting &middot; {points(c.lambda)}{' '}
                    charged
                  </p>
                </li>
              ))}
              {/*
                Held but not started carries no charge, and is shown anyway: the money was still
                spent, and a user looking at a £4.6m defender on the bench is entitled to know why he
                is there.
              */}
              {concentration.benched.map((c) => (
                <li
                  key={`benched-${c.club}-${c.players.join('-')}`}
                  className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs opacity-70"
                >
                  <p className="font-medium text-ink">
                    {c.players[0]}{' '}
                    <span className="font-normal text-ink-3">and</span>{' '}
                    {c.players[1]}
                  </p>
                  <p className="mt-0.5 text-ink-3">
                    {c.club} &middot; owned, not both starting &middot; nothing
                    charged
                  </p>
                </li>
              ))}
            </ul>
          )}

          <Note title="The correlation was measured; the charge is a policy choice" tone="warn">
            {concentration.statement}
          </Note>
        </div>
      </div>
    </Card>
  );
}
