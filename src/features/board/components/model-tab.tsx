import { Note } from '@/components/ui/note';
import { ReasoningPanel } from '@/features/squad/components/reasoning-panel';
import type { TeamData } from '../load-team';
import { Eyebrow } from './why';

/**
 * The model's own prose, moved whole off the decision surface: what the optimizer refused and paid,
 * what the advice does not answer, and the plan's caveats when there is one. Nothing here is new;
 * everything here used to sit between the captain and the roster.
 */
export function ModelTab({ team }: { team: TeamData }) {
  const { advice, plan } = team;
  return (
    <div className="flex flex-col gap-6">
      <ReasoningPanel advice={advice} />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Eyebrow>What this advice does not answer</Eyebrow>
          <Note tone="limit">
            <ul className="flex flex-col gap-1">
              {advice.notAdvisedOn.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Note>
        </div>
        {plan && (
          <div className="flex flex-col gap-2">
            <Eyebrow>What the plan is not</Eyebrow>
            <Note tone="limit">
              <ul className="flex flex-col gap-1">
                {plan.caveats.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Note>
            {plan.sellValueUnknown.length > 0 && (
              <Note title="One number here is weaker than the others" tone="warn">
                Sell value could not be reconstructed for {plan.sellValueUnknown.join(', ')}, so the
                budget used the market price. That overstates what you would get for a player whose
                price has risen — the direction that produces a plan you cannot afford.
              </Note>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
