import { useId } from 'react';
import { cn } from '../../utils/format';
import { controlBase, controlState, errorClass, hintClass, labelClass } from './fieldStyles';

export default function Input({
  label,
  error,
  hint,
  icon: Icon,
  required = false,
  id,
  className = '',
  containerClassName = '',
  ...props
}) {
  const reactId = useId();
  const inputId = id || reactId;

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className={labelClass}>
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      )}
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
        ) : null}
        <input
          id={inputId}
          className={cn(controlBase, 'h-10', controlState(error), Icon ? 'pl-9' : '', className)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className={errorClass}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className={hintClass}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
