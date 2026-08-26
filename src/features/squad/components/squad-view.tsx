import Link from 'next/link';
import { Badge, FactChip } from '@/components/ui/badge';
import { Provenance } from '@/components/ui/provenance';
import type { ApiResponseMeta } from '@/lib/api/types';
import { money } from '@/lib/format';
import type { Advice, Squad } from '../api/squad.api';
import {
  AdviceStats,
  CaptainCard,
  ComparisonCard,
  LimitsNote,
  RosterSection,
} from './advice-panel';
import { Pitch } from './pitch';

/**
 * One view for all three ways a squad arrives, which is the point of the backend returning one
 * shape for all of them. Server-rendered end to end: nothing here holds state.
 *
 * The layout answers the visit in order — who to captain, then the shape of the XI, then the
 * comparison, then the roster. On a wide screen the pitch and the captain call sit side by side,
 * because the two are read together; below `lg` they stack in the same order.
 */
export function SquadView({
  squad,
  advice,
  meta,
}: {
  squad: Squad;
  advice: Advice;
  meta: ApiResponseMeta | null;
}) {
  const isRecommended = squad.source === 'recommended';

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {/*
              The heading is the team id, not the manager's name, and stays that way on every
              visit. The name is only in the payload of a fresh import — it is not stored, so a
              name-led heading would silently become "Team 1" the second time you looked.
            */}
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {isRecommended ? 'The recommended squad' : `Team ${squad.managerId}`}
            </h1>
            <p className="mt-1 text-xs text-ink-3">
              {isRecommended
                ? 'The best legal 15 the optimizer can build from scratch at today’s prices'
                : `${squad.managerName ? `${squad.managerName} · ` : ''}your last locked squad, from gameweek ${squad.gameweekId}, imported from the public FPL API`}
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
          {/* Two gameweeks are in play on an imported squad — the one the picks are from and the
              one being advised on — and labelling this "gameweek" made them look like one. */}
          <FactChip
            label="Advising"
            value={`GW ${advice.gameweekId}`}
            title="The gameweek these projections are for"
          />
        </div>

        <Provenance
          meta={meta}
          modelVersion={advice.modelVersion}
          gameweekId={advice.gameweekId}
        />
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Pitch squad={squad} advice={advice} />
        <div className="flex flex-col gap-3">
          <CaptainCard advice={advice} />
          <AdviceStats advice={advice} className="grid grid-cols-2 gap-2" />
        </div>
      </div>

      <ComparisonCard advice={advice} />
      <RosterSection players={advice.players} />
      <LimitsNote advice={advice} />
    </main>
  );
}
