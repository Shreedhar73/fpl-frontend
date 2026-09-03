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
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} = {}): string {
  return cx(
    'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-45',
    size === 'sm' && 'h-8 px-3 text-xs',
    size === 'md' && 'h-10 px-4 text-sm',
    size === 'lg' && 'h-12 px-6 text-base',
    variant === 'primary' &&
      'bg-accent text-accent-ink hover:opacity-90 disabled:hover:opacity-45',
    variant === 'secondary' &&
      'border border-line-strong bg-surface text-ink hover:bg-surface-2',
    variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
    className,
  );
}

export const inputClass = cx(
  'h-10 rounded-full border border-line-strong bg-surface px-4 text-sm text-ink',
  'placeholder:text-ink-3',
);
