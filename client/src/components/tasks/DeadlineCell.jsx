import { Badge, OverdueBadge } from '../ui/Badge';
import { cn, formatDate, isDueSoon, isOverdue } from '../../utils/format';

export default function DeadlineCell({ task, className = '' }) {
  const overdue = isOverdue(task);
  const dueSoon = isDueSoon(task);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className={cn('whitespace-nowrap text-sm', overdue ? 'font-semibold text-rose-600' : 'text-ink-700')}>
        {formatDate(task.deadline)}
      </span>
      {overdue ? <OverdueBadge className="w-fit" /> : dueSoon ? <Badge tone="warning" className="w-fit">Due soon</Badge> : null}
    </div>
  );
}
