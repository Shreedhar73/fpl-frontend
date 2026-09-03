import { points } from '@/lib/format';
import type { TeamData } from '../load-team';
import { Eyebrow, Why } from './why';

/**
 * Three one-liners on what the model refused, paid, or could not check — each a link to the
 * Model or Plan tab where the statement lives. The sentences come from the payload, shortened
 * here only by omission, never by rewording a refusal into a number.
 */
export function WontTell({ team }: { team: TeamData }) {
  const { advice, plan, basePath, query } = team;
  const r = advice.reasoning;
  const floor = r?.appearanceFloor;
  const conc = r?.defenceConcentration;
  const modelHref = `${basePath}/model${query}`;
  const planHref = `${basePath}/plan${query}`;

  return (
    <div className="grid grid-cols-1 gap-5 border-t border-line pt-4 md:grid-cols-3">
      <div className="flex flex-col gap-0.5">
        <Eyebrow>Not judged</Eyebrow>
        {floor ? (
          <>
            <span className="text-[13px] text-ink">
              {floor.excluded} players under {floor.threshold} appearances never entered the pool.
            </span>
            <span className="text-xs text-ink-3">
              {floor.wouldHaveMadeTheSquad.length > 0
                ? `${floor.wouldHaveMadeTheSquad.map((p) => p.webName).join(' and ')} would have made the 15.`
                : 'None of them would have made this 15.'}
              {floor.costEp !== null && <> Cost {points(floor.costEp)} xP.</>} <Why href={modelHref}>Model</Why>
            </span>
          </>
        ) : (
          <span className="text-[13px] text-ink-2">The model stated no floor for this advice.</span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <Eyebrow>Defence pairs</Eyebrow>
        {conc ? (
          <>
            <span className="text-[13px] text-ink">
              {conc.pairsHeld === 0
                ? 'No two of this squad’s defence share a club.'
                : conc.started.length > 0
                  ? `${conc.started.map((p) => p.players.join(' and ')).join('; ')} share a clean sheet and both start.`
                  : `${conc.benched.map((p) => p.players.join(' and ')).join('; ')} share a clean sheet. Nothing charged: not both starting.`}
            </span>
            <span className="text-xs text-ink-3">
              {conc.penaltyEp > 0 ? `${points(conc.penaltyEp)} xP charged. ` : ''}A policy, not a measured gain. <Why href={modelHref}>Model</Why>
            </span>
          </>
        ) : (
          <span className="text-[13px] text-ink-2">No concentration statement on this advice.</span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <Eyebrow>Sell values</Eyebrow>
        {plan ? (
          <>
            <span className="text-[13px] text-ink">
              {plan.sellValueUnknown.length === 0
                ? team.source.kind === 'built'
                  ? 'Market prices, exact: this 15 was never bought.'
                  : 'All 15 reconstructed from your transfer log. None estimated.'
                : `${plan.sellValueUnknown.length} of 15 fell back to the market price.`}
            </span>
            <span className="text-xs text-ink-3">
              Free transfers {plan.freeTransfersSource === 'stated' ? 'as you stated' : plan.freeTransfersReconstructed ? 'replayed from history' : 'replayed, a lower bound'}: {plan.freeTransfers}. <Why href={planHref}>Plan</Why>
            </span>
          </>
        ) : (
          <span className="text-[13px] text-ink-2">
            {team.source.kind === 'recommended' ? 'Nothing to sell: this 15 belongs to nobody.' : 'No plan, so no sell values to check.'}
          </span>
        )}
      </div>
    </div>
  );
}
