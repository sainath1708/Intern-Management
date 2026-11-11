import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, CheckCircle2, ListChecks, PlayCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button, { buttonClasses } from '../../components/ui/Button';
import { PriorityBadge, ReviewStatusBadge, TaskStatusBadge } from '../../components/ui/Badge';
import DeadlineCell from '../../components/tasks/DeadlineCell';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Spinner';
import { listTasks, updateTaskStatus } from '../../services/taskService';
import { DEFAULT_PAGE_SIZE, TASK_STATUSES } from '../../utils/constants';
import { truncate } from '../../utils/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const tabs = [{ label: 'All tasks', value: '' }, ...TASK_STATUSES.map((status) => ({ label: status, value: status }))];

export default function InternTasksPage() {
  useDocumentTitle('My tasks');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await listTasks({ status, page, limit: DEFAULT_PAGE_SIZE }));
    } catch (requestError) {
      setError(requestError.message || 'Unable to load your tasks.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const handleStart = async (task) => {
    setStartingId(task.id);
    try {
      await updateTaskStatus(task.id, 'In Progress');
      toast.success('Task moved to In Progress');
      await load();
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to update the task.');
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My tasks"
        description="Everything assigned to you, with deadlines and review progress."
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              status === tab.value
                ? 'bg-ink-900 text-white'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={status === 'Completed' ? CheckCircle2 : ListChecks}
            title={status ? `No ${status.toLowerCase()} tasks` : 'No tasks assigned yet'}
            description={
              status
                ? 'Try another status filter to see the rest of your work.'
                : 'Your administrator has not assigned any work yet. Check back soon.'
            }
            action={
              status ? (
                <Button variant="secondary" onClick={() => setStatus('')}>
                  Show all tasks
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-ink-100">
              {data.items.map((task) => (
                <li key={task.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/intern/tasks/${task.id}`}
                          className="text-sm font-semibold text-ink-900 transition hover:text-brand-700"
                        >
                          {task.title}
                        </Link>
                        <TaskStatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                        {task.latestSubmission ? (
                          <ReviewStatusBadge status={task.latestSubmission.reviewStatus} />
                        ) : null}
                      </div>
                      <p className="mt-1.5 max-w-2xl text-sm text-ink-500">{truncate(task.description, 160)}</p>
                      <div className="mt-3">
                        <DeadlineCell task={task} />
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {task.status === 'Pending' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={PlayCircle}
                          loading={startingId === task.id}
                          onClick={() => handleStart(task)}
                        >
                          Start working
                        </Button>
                      ) : null}
                      <Link
                        to={`/intern/tasks/${task.id}`}
                        className={buttonClasses({ variant: 'primary', size: 'sm' })}
                      >
                        Open task
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination pagination={data.pagination} onPageChange={setPage} loading={loading} itemLabel="tasks" />
          </>
        )}
      </Card>
    </div>
  );
}
