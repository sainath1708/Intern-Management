import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/format';

const tones = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export function Badge({ tone = 'neutral', dot = true, className = '', children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        tones[tone] || tones.neutral,
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

const taskStatusTones = {
  Pending: 'warning',
  'In Progress': 'info',
  Completed: 'success',
};

export function TaskStatusBadge({ status }) {
  return <Badge tone={taskStatusTones[status] || 'neutral'}>{status}</Badge>;
}

const priorityTones = {
  Low: 'neutral',
  Medium: 'warning',
  High: 'danger',
};

export function PriorityBadge({ priority }) {
  return <Badge tone={priorityTones[priority] || 'neutral'}>{priority}</Badge>;
}

const reviewTones = {
  Submitted: 'info',
  Approved: 'success',
  'Needs Changes': 'warning',
};

export function ReviewStatusBadge({ status }) {
  return <Badge tone={reviewTones[status] || 'neutral'}>{status}</Badge>;
}

export function InternStatusBadge({ status }) {
  const active = status === 'active';
  return <Badge tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Inactive'}</Badge>;
}

export function OverdueBadge({ className = '' }) {
  return (
    <Badge tone="danger" dot={false} className={className}>
      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
      Overdue
    </Badge>
  );
}
