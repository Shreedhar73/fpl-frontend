import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAdvice,
  getTransferPlan,
  importSquad,
  type Advice,
  type Squad,
  type TransferPlan,
} from '@/features/squad/api/squad.api';
import { ErrorState } from '@/features/squad/components/error-state';
import { SquadView } from '@/features/squad/components/squad-view';
import type { ApiResponseMeta } from '@/lib/api/types';

/**
 * The tab title, with the id checked so a junk segment does not become one.
 *
 * Measured, not assumed, against `next start` on 2026-08-26: `/squad/abc` renders the not-found
 * page but answers **200**, and it does so whether the `notFound()` is called here, in the page, or
 * in both — while an unmatched route like `/nope` still answers 404. That is Next 16.3's behaviour
 * on a dynamic segment, so nothing here pretends to fix it; the user-visible outcome, the
 * not-found page with a way back, is right either way.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ managerId: string }>;
}): Promise<Metadata> {
  const { managerId } = await params;
  const id = Number(managerId);
  return { title: Number.isInteger(id) && id > 0 ? `Team ${id}` : 'Team' };
}

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
    squad = (await importSquad(id)).data;
  } catch (err) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <ErrorState error={err} title={`Could not load team ${id}`} />
      </main>
    );
  }

  let advice: Advice;
  let meta: ApiResponseMeta | null;
  try {
    const result = await getAdvice(id);
    advice = result.data;
    meta = result.meta;
  } catch (err) {
    // The squad loaded and the advice did not — usually because the projections have not been run
    // for the coming gameweek. Say so plainly rather than showing nothing.
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6">
        <ErrorState error={err} title="Loaded the squad, but not the advice" />
      </main>
    );
  }

  // The plan is fetched LAST and its failure is not fatal. It makes two on-demand calls against the
  // FPL API and a second solve, so it is the piece most likely to be slow or unavailable — and a
  // squad with its advice is still worth a page without it. `notAdvisedOn` in the advice already
  // states the limits, so nothing on screen claims a plan that is not there.
  let transferPlan: TransferPlan | null = null;
  try {
    transferPlan = (await getTransferPlan(id)).data;
  } catch {
    transferPlan = null;
  }

  return (
    <SquadView
      squad={squad}
      advice={advice}
      meta={meta}
      transferPlan={transferPlan}
    />
  );
}
