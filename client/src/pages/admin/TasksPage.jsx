import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardList, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button, { buttonClasses } from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import Avatar from '../../components/ui/Avatar';
import { PriorityBadge, TaskStatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Spinner';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import DeadlineCell from '../../components/tasks/DeadlineCell';
import { deleteTask, listTasks } from '../../services/taskService';
import { listInterns } from '../../services/internService';
import { DEFAULT_PAGE_SIZE, PRIORITIES, TASK_STATUSES } from '../../utils/constants';
import { formatDate, isOverdue, truncate } from '../../utils/format';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function TasksPage() {
  useDocumentTitle('Tasks');
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState('');
  const [internId, setInternId] = useState(searchParams.get('internId') || '');
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], pagination: null });
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const hasFilters = Boolean(debouncedSearch || status || priority || internId);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listTasks({
        search: debouncedSearch,
        status,
        priority,
        internId,
        page,
        limit: DEFAULT_PAGE_SIZE,
      });
      setData(result);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, priority, internId, page, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listInterns({ limit: 100 })
      .then((result) => setInterns(result.items))
      .catch(() => setInterns([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, internId]);

  const handleSaved = () => setRefreshKey((key) => key + 1);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const result = await deleteTask(deleting.id);
      toast.success(result?.message || 'Task deleted');
      setDeleting(null);
      if (data.items.length === 1 && page > 1) setPage((current) => current - 1);
      else handleSaved();
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to delete this task.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setInternId('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Assign work, set priorities and track progress across every intern."
        actions={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Create task
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 xl:flex-row xl:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search tasks…"
            className="w-full xl:max-w-xs"
            ariaLabel="Search tasks"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:flex xl:items-center">
            <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {TASK_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter by priority">
              <option value="">All priorities</option>
              {PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select value={internId} onChange={(event) => setInternId(event.target.value)} aria-label="Filter by intern">
              <option value="">All interns</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>
                  {intern.name}
                </option>
              ))}
            </Select>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={hasFilters ? ListChecks : ClipboardList}
            title={hasFilters ? 'No tasks match these filters' : 'No tasks yet'}
            description={
              hasFilters
                ? 'Try another combination of status, priority or intern filters.'
                : 'Create your first task and assign it to an active intern.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button icon={Plus} onClick={() => setFormOpen(true)}>
                  Create task
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assigned intern</th>
                    <th className="hidden md:table-cell">Deadline</th>
                    <th className="hidden sm:table-cell">Priority</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((task) => (
                    <tr key={task.id} className={isOverdue(task) ? 'bg-rose-50/30' : undefined}>
                      <td className="max-w-[18rem]">
                        <p className="truncate font-medium text-ink-800">{task.title}</p>
                        <p className="mt-0.5 text-xs text-ink-400">Created {formatDate(task.createdAt)}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={task.assignedTo?.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink-800">{task.assignedTo?.name}</p>
                            <p className="truncate text-xs text-ink-400">{task.assignedTo?.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <DeadlineCell task={task} />
                      </td>
                      <td className="hidden sm:table-cell">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td>
                        <TaskStatusBadge status={task.status} />
                        {task.latestSubmission ? (
                          <p className="mt-1 text-[11px] text-ink-400">
                            Attempt {task.latestSubmission.attempt} · {task.latestSubmission.reviewStatus}
                          </p>
                        ) : null}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/submissions?taskId=${task.id}`}
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
                            aria-label={`View submissions for ${task.title}`}
                            title="View submissions"
                          >
                            <ClipboardList className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(task);
                              setFormOpen(true);
                            }}
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
                            aria-label={`Edit ${task.title}`}
                            title="Edit task"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(task)}
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Delete ${task.title}`}
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={setPage} loading={loading} itemLabel="tasks" />
          </>
        )}
      </Card>

      <TaskFormModal
        open={formOpen}
        task={editing}
        interns={interns}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={`Delete "${deleting?.title || 'task'}"?`}
        description="This permanently deletes the task and any submission attempts linked to it. Review history for this task will no longer be available."
        confirmLabel="Delete task"
        variant="danger"
      >
        {deleting ? (
          <p className="text-xs text-ink-500">
            Assigned to {deleting.assignedTo?.name}. Delete only if the task was created by mistake.
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
