import { cx } from '@/lib/format';
import { Countdown } from './countdown';

/**
 * The deadline: the date server-rendered in UTC, a client leaf that swaps in the reader's zone
 * and keeps a countdown. Nothing here is hardcoded — the instant comes from
 * `GET /api/gameweeks/next`, and when the backend has none the caller renders nothing.
 */
export function Deadline({
  gameweekId,
  deadlineTime,
  compact = false,
  className,
}: {
  gameweekId: number;
  deadlineTime: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cx('items-center gap-2 text-xs', className ?? 'inline-flex')}>
      {!compact && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
          GW {gameweekId} deadline
        </span>
      )}
      <Countdown iso={deadlineTime} gameweekId={gameweekId} compact={compact} />
    </span>
  );
}
