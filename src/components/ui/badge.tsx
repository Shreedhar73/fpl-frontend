import type { ReactNode } from 'react';
import { cx } from '@/lib/format';
import { statusLabel, statusTone } from '@/lib/status';

export type Position = 'GKP' | 'DEF' | 'MID' | 'FWD';

/**
 * Position colour is never the only signal. The four hues are validated for colour-vision
 * separation only in the presence of a text label (see the note over the tokens in globals.css),
 * so this component always prints the position it colours.
 */
const POSITION_VAR: Record<Position, string> = {
  GKP: 'var(--gkp)',
  DEF: 'var(--def)',
  MID: 'var(--mid)',
  FWD: 'var(--fwd)',
};

export function positionColor(position: Position): string {
  return POSITION_VAR[position];
}

export function PositionChip({
  position,
  className,
}: {
  position: Position;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        className,
      )}
      style={{
        color: POSITION_VAR[position],
        backgroundColor: `color-mix(in oklab, ${POSITION_VAR[position]} 14%, transparent)`,
      }}
    >
      {position}
    </span>
  );
}

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'accent';

const TONE: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-ink-2',
  good: 'bg-[color-mix(in_oklab,var(--good)_14%,transparent)] text-good',
  warn: 'bg-[color-mix(in_oklab,var(--warn)_16%,transparent)] text-warn',
  bad: 'bg-[color-mix(in_oklab,var(--bad)_14%,transparent)] text-bad',
  accent: 'bg-accent text-accent-ink',
};

export function Badge({
  children,
  tone = 'neutral',
  title,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Availability, spelled out. Rendered for every status but `a`, which needs no chip; the news
 * sits in the title so a hover or a long-press explains the flag without another line.
 */
export function StatusBadge({
  status,
  news,
  chance,
  className,
}: {
  status: string;
  news?: string | null;
  chance?: number | null;
  className?: string;
}) {
  if (status === 'a') return null;
  return (
    <Badge tone={statusTone(status)} title={news ?? undefined} className={className}>
      {statusLabel(status)}
      {chance !== null && chance !== undefined && (
        <span className="tabular-nums opacity-80">{chance}%</span>
      )}
    </Badge>
  );
}

/**
 * A fixture's difficulty, 1 to 5, as FPL rates it — always with the number printed, because the
 * tone alone is a colour and colour alone is not a signal here.
 */
export function DifficultyChip({
  difficulty,
  className,
}: {
  difficulty: number;
  className?: string;
}) {
  const tone: Tone =
    difficulty <= 2 ? 'good' : difficulty === 3 ? 'neutral' : 'bad';
  return (
    <span
      title={`Fixture difficulty ${difficulty} of 5`}
      className={cx(
        'inline-grid size-5 place-items-center rounded-md text-[10px] font-bold tabular-nums',
        TONE[tone],
        className,
      )}
    >
      {difficulty}
    </span>
  );
}

/** A label/value pair on one line — squad value, bank, the chip in play. */
export function FactChip({
  label,
  value,
  title,
}: {
  label: string;
  value: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className="inline-flex items-baseline gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1"
    >
      <span className="text-[10px] uppercase tracking-wider text-ink-3">
        {label}
      </span>
      <span className="text-xs font-semibold tabular-nums text-ink">{value}</span>
    </span>
  );
}
