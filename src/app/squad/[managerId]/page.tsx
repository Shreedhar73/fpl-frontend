import { notFound } from 'next/navigation';
import {
  getAdvice,
  importSquad,
  type Advice,
  type Squad,
} from '@/features/squad/api/squad.api';
import { ErrorState } from '@/features/squad/components/error-state';
import { SquadView } from '@/features/squad/components/squad-view';

/**
 * A manager's squad and its advice. A server component: both calls happen on the server, and the
 * page ships no JavaScript of its own.
 *
 * `importSquad` rather than `getSquad` on purpose — the backend short-circuits to Postgres when it
 * already holds this manager's squad for the latest locked gameweek, so one call covers both
 * "first visit" and "come back later" without the page having to know which it is.
 *
 * Each fetch sits inside its own try and every piece of JSX outside one: JSX constructed inside a
 * catch would swallow render errors from the tree beneath it.
 */
export default async function ManagerSquadPage({
  params,
}: {
  params: Promise<{ managerId: string }>;
}) {
  const { managerId } = await params;
  const id = Number(managerId);
  if (!Number.isInteger(id) || id < 1) notFound();

  let squad: Squad;
  try {
    squad = await importSquad(id);
  } catch (err) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <ErrorState error={err} title={`Could not load team ${id}`} />
      </main>
    );
  }

  let advice: Advice;
  try {
    advice = await getAdvice(id);
  } catch (err) {
    // The squad loaded and the advice did not — usually because the projections have not been run
    // for the coming gameweek. Say so plainly rather than showing nothing.
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <ErrorState error={err} title="Loaded the squad, but not the advice" />
      </main>
    );
  }

  return <SquadView squad={squad} advice={advice} />;
}
