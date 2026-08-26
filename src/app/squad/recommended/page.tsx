import type { Metadata } from 'next';
import {
  getRecommendedAdvice,
  getRecommendedSquad,
  type Advice,
  type Squad,
} from '@/features/squad/api/squad.api';
import { ErrorState } from '@/features/squad/components/error-state';
import { SquadView } from '@/features/squad/components/squad-view';
import type { ApiResponseMeta } from '@/lib/api/types';

export const metadata: Metadata = {
  title: 'Recommended squad',
  description:
    'The best legal 15 the optimizer can build from scratch under the full FPL ruleset.',
};

/**
 * The optimizer's own 15, through the same view as an imported squad.
 *
 * This route is a static segment and must stay declared alongside `[managerId]` — Next matches the
 * literal first, so "recommended" is never read as a manager id.
 *
 * The fetch is inside the try and the JSX is outside it: JSX built inside a catch swallows render
 * errors from the tree below it, which is not what this handler is for.
 */
export default async function RecommendedSquadPage() {
  let squad: Squad;
  let advice: Advice;
  let meta: ApiResponseMeta | null;

  try {
    const [squadResult, adviceResult] = await Promise.all([
      getRecommendedSquad(),
      getRecommendedAdvice(),
    ]);
    squad = squadResult.data;
    advice = adviceResult.data;
    // The advice envelope is the one that carries `dataAsOfGw` — it is the response with the model
    // output in it.
    meta = adviceResult.meta;
  } catch (err) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <ErrorState error={err} title="Could not build a recommended squad" />
      </main>
    );
  }

  return <SquadView squad={squad} advice={advice} meta={meta} />;
}
