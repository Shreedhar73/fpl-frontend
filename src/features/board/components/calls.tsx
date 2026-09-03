import { PositionChip } from '@/components/ui/badge';
import { cx, delta, money, percent, points } from '@/lib/format';
import { lineupSwaps, picksAreModels } from '@/lib/horizon';
import { PlayerTrigger } from '@/features/squad/components/player-sheet/player-trigger';
import type { TeamData } from '../load-team';
import { Eyebrow, Why } from './why';

/**
 * The three calls, in the order the week is decided. Each cell is one number and one sentence;
 * the case behind it is a tap away and never on this surface.
 */
export function Calls({ team }: { team: TeamData }) {
  const { advice, plan, players, basePath, query } = team;
  const captain = advice.captain;
  const vice = advice.viceCaptain;
  const yours = players.find((p) => p.isCaptain);
  const armbandAgrees = captain !== null && (yours === undefined || yours.playerId === captain.playerId);
  const swaps = picksAreModels(players) ? [] : lineupSwaps(players);
  const gap = advice.comparison.horizonGap;
  const chipWindow = plan?.chips.find((c) => !c.spent && c.gameweekId !== null) ?? null;

  return (
    <div className="hairline-x grid grid-cols-1 border-y border-line-strong border-b-line md:grid-cols-3 max-md:hairline-y max-md:[&>*]:!border-l-0">
      {/* Captain */}
      <div className="flex flex-col gap-1.5 py-4 md:pr-6">
        <div className="flex items-center justify-between">
          <Eyebrow>Captain</Eyebrow>
          {captain && <Why href={`${basePath}${query}${query ? '&' : '?'}player=${captain.playerId}${vice ? `&vs=${vice.playerId}` : ''}`} />}
        </div>
        {captain ? (
          <>
            <div className="flex items-baseline gap-2.5">
              <PlayerTrigger playerId={captain.playerId} name={captain.webName} className="rounded-md hover:underline underline-offset-4">
                <span className="num text-[26px] font-extrabold leading-none text-ink sm:text-[28px]">{captain.webName}</span>
              </PlayerTrigger>
              <PositionChip position={captain.position} />
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="num text-[22px] font-bold text-ink">{points(captain.epNextGw * 2)}</span>
              <span className="text-xs text-ink-3">
                {points(captain.epNextGw)} × 2
                {captain.evidence && <> · {percent(captain.evidence.playProbability)} to play</>}
                {captain.evidence?.sd !== null && captain.evidence?.sd !== undefined && <> · ±{captain.evidence.sd.toFixed(1)}</>}
              </span>
            </div>
            <p className="flex items-center gap-2 text-[12.5px] text-ink-2">
              <span aria-hidden className={cx('size-2 shrink-0 rounded-full', armbandAgrees ? 'bg-good' : 'bg-warn')} />
              {armbandAgrees ? 'Matches your armband.' : `You have ${yours?.webName} — the model would move it.`}
              {vice && (
                <>
                  {' '}Vice {vice.webName}, {points(vice.epNextGw)}.
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-2">No projection for anyone in this squad this gameweek.</p>
        )}
      </div>

      {/* Transfers */}
      <div className="flex flex-col gap-1.5 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <Eyebrow>
            Transfers{plan && ` · ${plan.freeTransfers} free`}
          </Eyebrow>
          <Why href={`${basePath}/plan${query}`}>Plan</Why>
        </div>
        {plan ? (
          plan.moves.length === 0 ? (
            <>
              <div className="flex items-baseline gap-2.5">
                <span className="num text-[26px] font-extrabold leading-none text-ink sm:text-[28px]">Hold</span>
                <span className="text-xs text-ink-3">no move worth a free transfer over GW {plan.horizonGameweekIds[0]}–{plan.horizonGameweekIds[plan.horizonGameweekIds.length - 1]}</span>
              </div>
              <p className="text-[12.5px] text-ink-2">Holding is a decision the model made, not a gap in the answer.</p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2.5">
                <span className="num text-[26px] font-extrabold leading-none text-good sm:text-[28px]">{delta(plan.netGainEp)}</span>
                <span className="text-xs text-ink-3">
                  over GW {plan.horizonGameweekIds[0]}–{plan.horizonGameweekIds[plan.horizonGameweekIds.length - 1]} ·{' '}
                  {plan.hits === 0 ? 'no hits' : `${plan.hits} hit${plan.hits === 1 ? '' : 's'}, −${plan.hitCost} taken`}
                </span>
              </div>
              <ul className="mt-0.5 flex flex-col gap-1 text-[13px]">
                {plan.moves.slice(0, 3).map((m) => (
                  <li key={`${m.out.playerId}-${m.in.playerId}`} className="flex items-center gap-2">
                    <PositionChip position={m.out.position} />
                    <PlayerTrigger playerId={m.out.playerId} name={m.out.webName} className="text-ink-2 hover:underline underline-offset-2">{m.out.webName}</PlayerTrigger>
                    <Arrow />
                    <PlayerTrigger playerId={m.in.playerId} name={m.in.webName} className="font-semibold text-ink hover:underline underline-offset-2">{m.in.webName}</PlayerTrigger>
                    <span className="text-ink-3">{m.in.teamShortName} {money(m.in.nowCost)}</span>
                    <span className="num ml-auto font-bold text-good">{delta(m.gainEp)}</span>
                  </li>
                ))}
                {plan.moves.length > 3 && (
                  <li className="text-xs text-ink-3">and {plan.moves.length - 3} more on the plan</li>
                )}
              </ul>
            </>
          )
        ) : team.source.kind === 'recommended' ? (
          <>
            <div className="flex items-baseline gap-2.5">
              <span className="num text-[26px] font-extrabold leading-none text-ink sm:text-[28px]">None</span>
              <span className="text-xs text-ink-3">this is the 15 the optimizer would buy</span>
            </div>
            <p className="text-[12.5px] text-ink-2">Nothing buildable at today&apos;s prices projects higher over the horizon.</p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2.5">
              <span className="num text-[26px] font-extrabold leading-none text-ink-3 sm:text-[28px]">—</span>
              <span className="text-xs text-ink-3">the plan could not be loaded</span>
            </div>
            <p className="text-[12.5px] text-ink-2">{team.planError ?? 'FPL did not answer, or the projections for this gameweek have not been run.'}</p>
          </>
        )}
      </div>

      {/* Chips & lineup */}
      <div className="flex flex-col gap-1.5 py-4 md:pl-6">
        <div className="flex items-center justify-between">
          <Eyebrow>Chips &amp; lineup</Eyebrow>
          <Why href={`${basePath}/plan${query}#chips`} />
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="num text-[26px] font-extrabold leading-none text-ink sm:text-[28px]">
            {chipWindow ? chipWindow.label : 'Hold'}
          </span>
          <span className="text-xs text-ink-3">
            {chipWindow
              ? `the calendar argues for gameweek ${chipWindow.gameweekId}`
              : plan
                ? `no chip has a window in GW ${plan.horizonGameweekIds[0]}–${plan.horizonGameweekIds[plan.horizonGameweekIds.length - 1]}`
                : 'chips are windows, never decisions'}
          </span>
        </div>
        <ul className="mt-0.5 flex flex-col gap-1 text-[13px]">
          {swaps.slice(0, 2).map((s) => (
            <li key={s.in.playerId} className="flex items-center gap-2">
              <SwapIcon />
              <span className="text-ink-2">Start</span>
              <PlayerTrigger playerId={s.in.playerId} name={s.in.webName} className="font-semibold text-ink hover:underline underline-offset-2">{s.in.webName}</PlayerTrigger>
              <span className="text-ink-2">for</span>
              <PlayerTrigger playerId={s.out.playerId} name={s.out.webName} className="font-semibold text-ink hover:underline underline-offset-2">{s.out.webName}</PlayerTrigger>
              <span className={cx('num ml-auto font-bold', s.gain > 0 ? 'text-good' : 'text-ink-3')}>{delta(s.gain)}</span>
            </li>
          ))}
          {swaps.length === 0 && (
            <li className="flex items-center gap-2 text-ink-2">
              <span aria-hidden className="mx-[3px] size-2 rounded-full bg-good" />
              {picksAreModels(players) ? 'The XI is the model’s arrangement.' : 'Your XI is the one the model would field.'}
            </li>
          )}
          {gap >= 6 && team.source.kind !== 'recommended' && (
            <li className="flex items-center gap-2 text-ink-2">
              <span aria-hidden className="mx-[3px] size-2 shrink-0 rounded-full bg-warn" />
              <span>Wildcard: the best 15 is {points(gap)} ahead over the horizon. Your call, not the model&apos;s.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l3 3M17 4l-3 3" />
    </svg>
  );
}
