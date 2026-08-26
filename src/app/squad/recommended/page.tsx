import {
  getRecommendedAdvice,
  getRecommendedSquad,
  type Advice,
  type Squad,
} from '@/features/squad/api/squad.api';
import { ErrorState } from '@/features/squad/components/error-state';
import { SquadView } from '@/features/squad/components/squad-view';

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

  try {
    [squad, advice] = await Promise.all([
      getRecommendedSquad(),
      getRecommendedAdvice(),
    ]);
  } catch (err) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <ErrorState error={err} title="Could not build a recommended squad" />
      </main>
    );
  }

  return <SquadView squad={squad} advice={advice} />;
}
