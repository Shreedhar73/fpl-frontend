import { PositionChip } from '@/components/ui/badge';
import { Card, SectionHeading } from '@/components/ui/card';
import { Note } from '@/components/ui/note';
import { points } from '@/lib/format';
import type { Advice } from '../api/squad.api';

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

  const { appearanceFloor: floor, fixtureCollisions: collisions } = reasoning;

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
                    <span className="flex min-w-0 items-center gap-2">
                      <PositionChip position={p.position} />
                      <span className="truncate font-medium text-ink">
                        {p.webName}
                      </span>
                      <span className="text-ink-3">{p.teamShortName}</span>
                    </span>
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
          <SectionHeading
            level={3}
            title="Betting against itself"
            subtitle={`${collisions.pairsConsidered.toLocaleString()} attacker-and-defender pairs were priced across the pool; this XI kept ${collisions.taken.length}.`}
            aside={
              <span title="Horizon expected points charged to this XI for the pairs it kept">
                paid {points(collisions.penaltyEp)}
              </span>
            }
          />

          {collisions.taken.length === 0 ? (
            <p className="text-xs leading-5 text-ink-2">
              This XI holds no attacker against its own defender, so it paid
              nothing.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {collisions.taken.map((c) => (
                <li
                  key={`${c.fixture}-${c.attacker}-${c.defender}`}
                  className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs"
                >
                  <p className="font-medium text-ink">
                    {c.attacker}{' '}
                    <span className="font-normal text-ink-3">against</span>{' '}
                    {c.defender}
                  </p>
                  <p className="mt-0.5 text-ink-3">
                    {c.fixture} · {points(c.lambda)} charged
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/*
            `warn`, not `limit`, and the difference is the point. The floor's note explains a rule we
            stand behind. This one carries a measurement that did not support the rule it justifies,
            and a reader who skims both should come away knowing which is which.
          */}
          <Note title="This one was measured, and it did not pay" tone="warn">
            {collisions.statement}
          </Note>
        </div>
      </div>
    </Card>
  );
}
