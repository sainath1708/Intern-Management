import { cn } from '../../utils/format';

export default function BrandMark({ className = '', compact = false, inverted = false }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl ring-1',
          inverted ? 'bg-white/10 ring-white/15' : 'bg-ink-950 ring-ink-800',
        )}
      >
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
          <path
            d="M16 5a11 11 0 1 0 11 11"
            fill="none"
            stroke="#818cf8"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <circle cx="26" cy="6.5" r="3" fill="#6366f1" />
        </svg>
      </span>
      {!compact ? (
        <div className="leading-tight">
          <p className={cn('text-sm font-semibold tracking-tight', inverted ? 'text-white' : 'text-ink-900')}>
            Qubenix AI
          </p>
          <p className={cn('text-[11px] font-medium', inverted ? 'text-ink-400' : 'text-ink-500')}>
            Intern Management
          </p>
        </div>
      ) : null}
    </div>
  );
}
