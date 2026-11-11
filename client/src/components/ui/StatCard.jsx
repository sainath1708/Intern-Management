import { Link } from 'react-router-dom';
import { cn } from '../../utils/format';

const tones = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-600 ring-amber-100',
  info: 'bg-sky-50 text-sky-600 ring-sky-100',
  danger: 'bg-rose-50 text-rose-600 ring-rose-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
};

export default function StatCard({ label, value, icon: Icon, tone = 'brand', hint, to, loading = false }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          {loading ? (
            <span className="mt-2 block h-8 w-16 animate-pulse rounded bg-ink-200" />
          ) : (
            <p className="mt-1.5 text-3xl font-semibold tracking-tight text-ink-900">{value ?? 0}</p>
          )}
        </div>
        {Icon ? (
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset', tones[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-3 text-xs text-ink-500">{hint}</p> : null}
    </>
  );

  const className = cn(
    'block rounded-2xl border border-ink-200 bg-white p-5 shadow-card transition',
    to && 'hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-raised',
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
