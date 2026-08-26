import { cx } from '@/lib/format';

/**
 * Button styling as a function rather than a component, so a `<button>`, a `<Link>` and a form's
 * submit can all wear it without three wrappers around three different elements.
 */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
} = {}): string {
  return cx(
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-45',
    size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm',
    variant === 'primary' &&
      'bg-accent text-accent-ink hover:opacity-90 disabled:hover:opacity-45',
    variant === 'secondary' &&
      'border border-line-strong bg-surface text-ink hover:bg-surface-2',
    variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
    className,
  );
}

export const inputClass = cx(
  'rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink',
  'placeholder:text-ink-3',
);
