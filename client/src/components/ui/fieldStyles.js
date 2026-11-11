export const controlBase =
  'w-full rounded-lg border bg-white px-3 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500';

export const controlState = (error) =>
  error
    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
    : 'border-ink-300 focus:border-brand-500 focus:ring-brand-500/20';

export const labelClass = 'mb-1.5 block text-sm font-medium text-ink-700';

export const hintClass = 'mt-1.5 text-xs text-ink-500';
export const errorClass = 'mt-1.5 text-xs font-medium text-rose-600';
