import type { ApiResponseMeta } from '@/lib/api/types';
import { cx } from '@/lib/format';
import { LocalTime } from './local-time';

/**
 * Which gameweek's data produced the numbers above, which model version produced them, and when.
 *
 * This is required, not decorative: the app renders derived numbers, and the architecture contract
 * names "a stale projection rendered as if it were live" as its worst failure mode. Until B-009 the
 * client threw the envelope's `meta` away, so nothing on screen said any of this.
 *
 * When `meta` is missing — a backend older than the interceptor, or a fetch that got no envelope —
 * it says so rather than rendering a confident blank.
 */
export function Provenance({
  meta,
  modelVersion,
  gameweekId,
  className,
}: {
  meta: ApiResponseMeta | null;
  modelVersion?: string | null;
  gameweekId?: number | null;
  className?: string;
}) {
  const asOf = meta?.dataAsOfGw ?? gameweekId ?? null;

  return (
    <p
      className={cx(
        'flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-4 text-ink-3',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full bg-good"
        />
        {asOf === null ? (
          <span className="text-warn">gameweek of this data unknown</span>
        ) : (
          <>Data as of gameweek {asOf}</>
        )}
      </span>
      {modelVersion && (
        <>
          <span aria-hidden>·</span>
          <span>
            model <span className="font-mono">{modelVersion}</span>
          </span>
        </>
      )}
      {meta?.generatedAt && (
        <>
          <span aria-hidden>·</span>
          <span>
            computed <LocalTime iso={meta.generatedAt} />
          </span>
        </>
      )}
      {typeof meta?.durationMs === 'number' && (
        <>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{meta.durationMs} ms</span>
        </>
      )}
    </p>
  );
}
