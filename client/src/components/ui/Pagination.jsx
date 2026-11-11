import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({ pagination, onPageChange, loading = false, itemLabel = 'results' }) {
  if (!pagination || pagination.total === 0) return null;

  const { page, limit, total, totalPages, hasNextPage, hasPreviousPage } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-ink-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-500">
        Showing{' '}
        <span className="font-semibold text-ink-700">
          {start}–{end}
        </span>{' '}
        of <span className="font-semibold text-ink-700">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={ChevronLeft}
          disabled={!hasPreviousPage || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="px-1 text-xs font-medium text-ink-600">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button
          size="sm"
          variant="secondary"
          iconRight={ChevronRight}
          disabled={!hasNextPage || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
