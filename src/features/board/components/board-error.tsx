import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { TeamLoadError } from '../load-team';

/** A team that could not be loaded, as a sentence and two ways on. */
export function BoardError({ error, id }: { error: unknown; id: string }) {
  const stage = error instanceof TeamLoadError ? error.stage : 'squad';
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-12 sm:px-10">
      <div className="max-w-xl rounded-2xl border border-[color-mix(in_oklab,var(--warn)_40%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] p-5">
        <h1 className="num text-lg font-extrabold text-ink">
          {stage === 'advice' ? `Loaded ${id === 'built' ? 'the 15' : `team ${id}`}, but not the advice` : `Could not load ${id === 'built' ? 'that 15' : id === 'recommended' ? "the model's 15" : `team ${id}`}`}
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-ink-2">{message}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/" className={buttonClass({ size: 'sm' })}>Another team</Link>
          <Link href="/team/recommended" className={buttonClass({ variant: 'secondary', size: 'sm' })}>The model&apos;s 15</Link>
        </div>
      </div>
    </main>
  );
}
