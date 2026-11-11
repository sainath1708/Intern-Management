import { cn } from '../../utils/format';

export default function Card({ className = '', children, ...props }) {
  return (
    <section className={cn('rounded-2xl border border-ink-200 bg-white shadow-card', className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action, icon: Icon, className = '' }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4', className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
        <div>
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-ink-500">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
