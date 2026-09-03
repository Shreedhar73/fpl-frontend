import Link from 'next/link';
import { Badge, FactChip } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { RememberTeam } from '@/components/recent-teams';
import { Provenance } from '@/components/ui/provenance';
import type { ApiResponseMeta } from '@/lib/api/types';
import { money } from '@/lib/format';
import type { Advice, Squad, TransferPlan } from '../api/squad.api';
import {
  AdviceStats,
  CaptainCard,
  ComparisonCard,
  LimitsNote,
  RosterSection,
} from './advice-panel';
import { Pitch } from './pitch';
import { PlayerSheetProvider } from './player-sheet/player-sheet-context';
import { ReasoningPanel } from './reasoning-panel';
import { TransferPanel } from './transfer-panel';

/**
 * One view for all three ways a squad arrives, which is the point of the backend returning one
 * shape for all of them. Server-rendered end to end; the sheet provider and the tap targets are
 * the only client code, and they take the server-rendered markup as children.
 *
 * The layout answers the visit in order — who to captain, then the shape of the XI, then what to
 * do about it, then the comparison, then the roster. A sticky section nav under the header makes
 * the order skippable: plain anchors, so it costs no JavaScript.
 */
export function SquadView({
  squad,
  advice,
  meta,
  transferPlan,
}: {
  squad: Squad;
  advice: Advice;
  meta: ApiResponseMeta | null;
  /**
   * Null on the recommended squad, which has no manager and therefore no transfers, and null when
   * the plan call failed — the squad and its advice are still worth showing without it.
   */
  transferPlan?: TransferPlan | null;
}) {
  const isRecommended = squad.source === 'recommended';
  const sections = [
    { id: 'overview', label: 'Overview' },
    ...(transferPlan ? [{ id: 'transfers', label: 'Transfers' }] : []),
    { id: 'compare', label: 'Best 15' },
    { id: 'model', label: 'Model' },
    { id: 'roster', label: 'Roster' },
    { id: 'limits', label: 'Limits' },
  ];

  return (
    <PlayerSheetProvider>
      {squad.managerId !== null && (
        <RememberTeam id={squad.managerId} name={squad.managerName} />
      )}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pt-6 sm:px-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {/*
                The heading is the team id, not the manager's name, and stays that way on every
                visit. The name is only in the payload of a fresh import — it is not stored, so a
                name-led heading would silently become "Team 1" the second time you looked.
              */}
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">
                {isRecommended ? 'Optimizer' : 'Imported squad'} · advising gameweek {advice.gameweekId}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {isRecommended ? 'The recommended 15' : `Team ${squad.managerId}`}
              </h1>
              <p className="mt-1 text-xs text-ink-3 sm:text-sm">
                {isRecommended
                  ? 'The best legal 15 the optimizer can build from scratch at today’s prices'
                  : `${squad.managerName ? `${squad.managerName} · ` : ''}your last locked squad, from gameweek ${squad.gameweekId}, via the public FPL API`}
              </p>
            </div>
            <Link
              href="/"
              className="text-xs font-medium text-ink-2 underline underline-offset-2 hover:text-ink"
            >
              Another team
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isRecommended ? 'accent' : 'neutral'}>
              {isRecommended ? 'Optimizer' : 'Imported'}
            </Badge>
            <FactChip label="Squad" value={money(squad.teamValue)} />
            <FactChip label="Bank" value={money(squad.bank)} />
            {squad.activeChip && (
              <FactChip label="Chip" value={squad.activeChip} />
            )}
            <FactChip
              label="Shape"
              value={advice.comparison.formation}
              title="The formation the model would field"
            />
          </div>

          <Provenance
            meta={meta}
            modelVersion={advice.modelVersion}
            gameweekId={advice.gameweekId}
          />
        </header>

        <nav
          aria-label="Sections"
          className="scroll-x sticky top-14 z-20 -mx-4 border-y border-line bg-canvas/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6"
        >
          <ul className="flex gap-1.5 whitespace-nowrap">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink-2 hover:border-line-strong hover:text-ink"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div id="overview" className="grid scroll-mt-28 items-start gap-5 lg:grid-cols-2">
          <Pitch squad={squad} advice={advice} />
          <div className="flex flex-col gap-3">
            <CaptainCard advice={advice} />
            <AdviceStats advice={advice} className="grid grid-cols-2 gap-2" />
          </div>
        </div>

        {/* Before the comparison, because "what should I do" outranks "how far behind am I". The
            comparison then explains the gap the plan does not close. */}
        {transferPlan && (
          <div id="transfers" className="scroll-mt-28">
            <TransferPanel plan={transferPlan} />
          </div>
        )}
        <div id="compare" className="scroll-mt-28">
          <ComparisonCard
            advice={advice}
            planSlot={
              transferPlan ? (
                <>
                  <a
                    href="#transfers"
                    className={buttonClass({ variant: 'secondary', size: 'sm' })}
                  >
                    See the transfer plan
                  </a>
                  <span className="text-[11px] leading-4 text-ink-3">
                    These lists are a set difference. The plan above prices the
                    moves — sell values, your free transfers, and the −4 a hit
                    costs.
                  </span>
                </>
              ) : (
                <span className="text-[11px] leading-4 text-ink-3">
                  The transfer plan could not be loaded — FPL did not answer, or
                  the projections for this gameweek have not been run. Reload
                  to try again.
                </span>
              )
            }
          />
        </div>
        {/* After the comparison and before the roster: it explains the gap the comparison just
            showed, and a reader who has not asked "why is this squad this squad" has not needed it
            yet. */}
        <div id="model" className="scroll-mt-28">
          <ReasoningPanel advice={advice} />
        </div>
        <div id="roster" className="scroll-mt-28">
          <RosterSection players={advice.players} />
        </div>
        <div id="limits" className="scroll-mt-28">
          <LimitsNote advice={advice} />
        </div>
      </main>
    </PlayerSheetProvider>
  );
}
