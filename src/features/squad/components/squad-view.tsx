import Link from 'next/link';
import type { Advice, Squad } from '../api/squad.api';
import { money } from '../api/squad.api';
import { AdvicePanel } from './advice-panel';
import { Pitch } from './pitch';

/**
 * One view for all three ways a squad arrives, which is the point of the backend returning one
 * shape for all of them. Server-rendered end to end: nothing here holds state.
 */
export function SquadView({
  squad,
  advice,
}: {
  squad: Squad;
  advice: Advice;
}) {
  const isRecommended = squad.source === 'recommended';

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          {/*
            The heading is the team id, not the manager's name, and stays that way on every
            visit. The name is only in the payload of a fresh import — it is not stored, so a
            name-led heading would silently become "Team 1" the second time you looked.
          */}
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isRecommended ? 'The recommended squad' : `Team ${squad.managerId}`}
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {isRecommended
              ? 'Built from scratch at market prices'
              : `${squad.managerName ? `${squad.managerName} · ` : ''}gameweek ${squad.gameweekId} picks, imported from FPL`}{' '}
            · squad {money(squad.teamValue)} · bank {money(squad.bank)}
            {squad.activeChip ? ` · chip: ${squad.activeChip}` : ''}
          </p>
        </div>
        <Link
          href="/"
          className="text-xs font-medium text-zinc-500 underline dark:text-zinc-400"
        >
          Another team
        </Link>
      </header>

      <Pitch squad={squad} />
      <AdvicePanel advice={advice} />
    </main>
  );
}
