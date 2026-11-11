import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, ExternalLink, FileText, Github, Link2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import Avatar from '../../components/ui/Avatar';
import { Badge, ReviewStatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ReviewModal from '../../components/submissions/ReviewModal';
import { TableSkeleton } from '../../components/ui/Spinner';
import { listSubmissions } from '../../services/submissionService';
import { REVIEW_STATUSES, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { formatDateTime, truncate } from '../../utils/format';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function SubmissionsPage() {
  useDocumentTitle('Submissions');
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [reviewStatus, setReviewStatus] = useState(searchParams.get('reviewStatus') || '');
  const [taskId, setTaskId] = useState(searchParams.get('taskId') || '');
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], pagination: null, summary: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const hasFilters = Boolean(debouncedSearch || reviewStatus || taskId);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listSubmissions({
        search: debouncedSearch,
        reviewStatus,
        taskId,
        page,
        limit: DEFAULT_PAGE_SIZE,
      });
      setData(result);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load submissions.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, reviewStatus, taskId, page, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, reviewStatus, taskId]);

  const summary = data.summary || { Submitted: 0, Approved: 0, 'Needs Changes': 0 };
  const total = summary.Submitted + summary.Approved + summary['Needs Changes'];
  const filteredTaskTitle = data.items[0]?.task?.title;

  const summaryCards = [
    { label: 'All submissions', value: total, status: '' },
    { label: 'Awaiting review', value: summary.Submitted, status: 'Submitted' },
    { label: 'Approved', value: summary.Approved, status: 'Approved' },
    { label: 'Needs changes', value: summary['Needs Changes'], status: 'Needs Changes' },
  ];

  const clearFilters = () => {
    setSearch('');
    setReviewStatus('');
    setTaskId('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        description="Review intern work, approve completed tasks and request changes with feedback."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const active = reviewStatus === card.status;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setReviewStatus(card.status)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-brand-300 bg-brand-50 ring-1 ring-inset ring-brand-200'
                  : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/60'
              }`}
            >
              <p className={`text-xl font-semibold ${active ? 'text-brand-700' : 'text-ink-900'}`}>
                {loading && !data.summary ? '—' : card.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-ink-500">{card.label}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by intern, task or description…"
            className="w-full lg:max-w-md"
            ariaLabel="Search submissions"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={reviewStatus}
              onChange={(event) => setReviewStatus(event.target.value)}
              aria-label="Filter by review status"
            >
              <option value="">All review statuses</option>
              {REVIEW_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
            {taskId ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
                <Link2 className="h-3 w-3" aria-hidden="true" />
                {filteredTaskTitle ? truncate(filteredTaskTitle, 32) : 'Filtered by task'}
                <button
                  type="button"
                  onClick={() => setTaskId('')}
                  className="ml-1 text-ink-400 transition hover:text-ink-700"
                  aria-label="Clear task filter"
                >
                  ✕
                </button>
              </span>
            ) : null}
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            ) : null}
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <TableSkeleton rows={5} columns={3} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={hasFilters ? 'No submissions match these filters' : 'No submissions yet'}
            description={
              hasFilters
                ? 'Try clearing the filters to see every submission.'
                : 'When interns submit work, it will appear here ready for review.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-ink-100">
              {data.items.map((submission) => (
                <li key={submission.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <Avatar name={submission.intern?.name} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-ink-900">{submission.intern?.name}</p>
                          <Badge tone="neutral" dot={false}>
                            {submission.intern?.department}
                          </Badge>
                          <ReviewStatusBadge status={submission.reviewStatus} />
                        </div>
                        <p className="mt-1 text-sm font-medium text-ink-700">{submission.task?.title}</p>
                        <p className="mt-0.5 text-xs text-ink-400">
                          Attempt {submission.attempt} · Submitted {formatDateTime(submission.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={submission.reviewStatus === 'Submitted' ? 'primary' : 'secondary'}
                      onClick={() => setSelected(submission)}
                    >
                      {submission.reviewStatus === 'Submitted' ? 'Review' : 'View details'}
                    </Button>
                  </div>

                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-600">
                    {truncate(submission.description, 220)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {submission.githubUrl ? (
                      <a
                        href={submission.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-ink-300 hover:text-ink-900"
                      >
                        <Github className="h-3.5 w-3.5" aria-hidden="true" />
                        GitHub
                        <ExternalLink className="h-3 w-3 text-ink-400" aria-hidden="true" />
                      </a>
                    ) : null}
                    {submission.documentUrl ? (
                      <a
                        href={submission.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-ink-300 hover:text-ink-900"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        Document
                        <ExternalLink className="h-3 w-3 text-ink-400" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>

                  {submission.adminFeedback ? (
                    <p className="mt-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-xs text-ink-600">
                      <span className="font-semibold text-ink-700">Feedback:</span> {truncate(submission.adminFeedback, 220)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <Pagination
              pagination={data.pagination}
              onPageChange={setPage}
              loading={loading}
              itemLabel="submissions"
            />
          </>
        )}
      </Card>

      <ReviewModal
        open={Boolean(selected)}
        submission={selected}
        onClose={() => setSelected(null)}
        onReviewed={() => {
          setRefreshKey((key) => key + 1);
          setSelected(null);
        }}
      />
    </div>
  );
}
