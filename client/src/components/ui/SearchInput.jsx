import { Search, X } from 'lucide-react';
import { controlBase, controlState } from './fieldStyles';
import { cn } from '../../utils/format';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  ariaLabel = 'Search',
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(controlBase, 'h-10 pl-9 pr-9', controlState(false), '[&::-webkit-search-cancel-button]:hidden')}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
