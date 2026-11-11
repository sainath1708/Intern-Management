import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'h-5 w-5 text-brand-600' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-label="Loading" />;
}

export function FullPageLoader({ label = 'Loading your workspace…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-100">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-950 text-brand-300">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-ink-500">{label}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="divide-y divide-ink-100" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className={`h-3.5 animate-pulse rounded bg-ink-200 ${columnIndex === 0 ? 'w-40' : 'flex-1'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function InlineLoader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}
