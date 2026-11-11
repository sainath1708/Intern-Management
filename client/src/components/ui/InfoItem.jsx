import { cn } from '../../utils/format';

export default function InfoItem({ icon: Icon, label, children, className = '' }) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {Icon ? (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
        <div className="mt-0.5 break-words text-sm font-medium text-ink-800">{children}</div>
      </div>
    </div>
  );
}
