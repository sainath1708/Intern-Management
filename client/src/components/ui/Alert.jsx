import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '../../utils/format';

const tones = {
  info: {
    wrapper: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: Info,
  },
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: TriangleAlert,
  },
  danger: {
    wrapper: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: AlertCircle,
  },
};

export default function Alert({ tone = 'info', title, children, className = '' }) {
  const config = tones[tone] || tones.info;
  const Icon = config.icon;

  return (
    <div className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', config.wrapper, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
      </div>
    </div>
  );
}
