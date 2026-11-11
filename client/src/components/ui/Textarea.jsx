import { useId } from 'react';
import { cn } from '../../utils/format';
import { controlBase, controlState, errorClass, hintClass, labelClass } from './fieldStyles';

export default function Textarea({
  label,
  error,
  hint,
  required = false,
  id,
  rows = 4,
  className = '',
  containerClassName = '',
  ...props
}) {
  const reactId = useId();
  const textareaId = id || reactId;

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={textareaId} className={labelClass}>
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(controlBase, 'resize-y py-2.5 leading-relaxed', controlState(error), className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <p className={errorClass}>{error}</p> : hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}
