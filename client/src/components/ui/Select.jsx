import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/format';
import { controlBase, controlState, errorClass, hintClass, labelClass } from './fieldStyles';

export default function Select({
  label,
  error,
  hint,
  required = false,
  id,
  className = '',
  containerClassName = '',
  children,
  ...props
}) {
  const reactId = useId();
  const selectId = id || reactId;

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={selectId} className={labelClass}>
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(controlBase, 'h-10 appearance-none pr-9', controlState(error), className)}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
      </div>
      {error ? <p className={errorClass}>{error}</p> : hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}
