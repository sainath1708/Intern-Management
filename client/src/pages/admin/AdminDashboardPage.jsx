import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ListChecks,
  Plus,
  Timer,
  UserCheck,
  Users,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Avatar from '../../components/ui/Avatar';
import Button, { buttonClasses } from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { ReviewStatusBadge, TaskStatusBadge, OverdueBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats } from '../../services/dashboardService';
import { isOverdue, formatDate, relativeTime, truncate } from '../../utils/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const metrics = [
  { key: 'totalInterns', label: 'Total interns', icon: Users, tone: 'brand', to: '/admin/interns', hint: 'All intern profiles' },
  { key: 'activeInterns', label: 'Active interns', icon: UserCheck, tone: 'success', to: '/admin/interns?status=active', hint: 'Currently onboarded' },
  { key: 'totalTasks', label: 'Total tasks', icon: ListChecks, tone: 'info', to: '/admin/tasks', hint: 'Across all interns' },
  { key: 'completedTasks', label: 'Completed tasks', icon: CheckCircle2, tone: 'success', to: '/admin/tasks?status=Completed', hint: 'Approved and closed' },
  { key: 'pendingTasks', label: 'Pending tasks', icon: Clock, tone: 'warning', to: '/admin/tasks?status=Pending', hint: 'Not started yet' },
  { key: 'inProgressTasks', label: 'In progress', icon: Timer, tone: 'violet', to: '/admin/tasks?status=In%20Progress', hint: 'Work underway' },
];

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard');
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await getDashboardStats());
    } catch (requestError) {
      setError(requestError.message || 'Unable to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="A live view of your interns, task pipeline and work awaiting review."
        actions={
          <>
            <Link to="/admin/interns" className={buttonClasses({ variant: 'secondary' })}>
              <Users className="h-4 w-4" aria-hidden="true" />
              Add intern
            </Link>
            <Link to="/admin/tasks" className={buttonClasses({ variant: 'primary' })}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create task
            </Link>
          </>
        }
      />

      {error ? (
        <Card>
          <ErrorState title="Dashboard unavailable" message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <StatCard
                key={metric.key}
                label={metric.label}
                value={stats?.[metric.key]}
                icon={metric.icon}
                tone={metric.tone}
                hint={metric.hint}
                to={metric.to}
                loading={loading && !stats}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader
                title="Recent submissions"
                description="Latest work submitted by interns."
                icon={ClipboardCheck}
                action={
                  <Link
                    to="/admin/submissions"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View all
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                }
              />
              {loading && !stats ? (
                <TableSkeleton rows={4} columns={3} />
              ) : stats?.recentSubmissions?.length ? (
                <ul className="divide-y divide-ink-100">
                  {stats.recentSubmissions.map((submission) => (
                    <li key={submission.id} className="flex items-start gap-3 px-5 py-3.5">
                      <Avatar name={submission.intern?.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ink-800">
                            {submission.intern?.name}
                          </p>
                          <ReviewStatusBadge status={submission.reviewStatus} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-500">{submission.task?.title}</p>
                        <p className="mt-1 text-[11px] text-ink-400">
                          Attempt {submission.attempt} · {relativeTime(submission.submittedAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  compact
                  icon={ClipboardCheck}
                  title="No submissions yet"
                  description="Submissions will appear here as soon as interns start sending work for review."
                />
              )}
            </Card>

            <Card>
              <CardHeader title="Quick actions" description="Common administrative tasks." />
              <CardBody className="space-y-3">
                <Link
                  to="/admin/interns"
                  className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-ink-800">
                    <Users className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    Onboard a new intern
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-400" aria-hidden="true" />
                </Link>
                <Link
                  to="/admin/tasks"
                  className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-ink-800">
                    <ListChecks className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    Assign a new task
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-400" aria-hidden="true" />
                </Link>
                <Link
                  to="/admin/submissions"
                  className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-ink-800">
                    <ClipboardCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    Review submissions
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-400" aria-hidden="true" />
                </Link>

                <div className="mt-2 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4">
                  <div className="rounded-xl bg-amber-50 px-3 py-3 ring-1 ring-inset ring-amber-100">
                    <p className="text-lg font-semibold text-amber-800">{stats?.pendingReview ?? '—'}</p>
                    <p className="text-[11px] font-medium text-amber-700">Awaiting review</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 px-3 py-3 ring-1 ring-inset ring-rose-100">
                    <p className="text-lg font-semibold text-rose-800">{stats?.overdueTasks ?? '—'}</p>
                    <p className="text-[11px] font-medium text-rose-700">Overdue tasks</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Recent task activity"
              description="The newest tasks assigned across the team."
              icon={ListChecks}
              action={
                <Link
                  to="/admin/tasks"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  All tasks
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
            />
            {loading && !stats ? (
              <TableSkeleton rows={4} columns={4} />
            ) : stats?.recentTasks?.length ? (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th className="hidden md:table-cell">Intern</th>
                      <th className="hidden sm:table-cell">Deadline</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <p className="font-medium text-ink-800">{task.title}</p>
                          <p className="mt-0.5 text-xs text-ink-400">{truncate(task.description, 60)}</p>
                        </td>
                        <td className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Avatar name={task.assignedTo?.name} size="sm" />
                            <span className="text-sm">{task.assignedTo?.name}</span>
                          </div>
                        </td>
                        <td className="hidden whitespace-nowrap sm:table-cell">
                          <div className="flex items-center gap-2">
                            <span className={isOverdue(task) ? 'font-medium text-rose-600' : ''}>
                              {formatDate(task.deadline)}
                            </span>
                            {isOverdue(task) ? <OverdueBadge /> : null}
                          </div>
                        </td>
                        <td>
                          <TaskStatusBadge status={task.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                compact
                icon={ListChecks}
                title="No tasks yet"
                description="Create the first task to start tracking intern progress."
                action={
                  <Link to="/admin/tasks" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                    Create a task
                  </Link>
                }
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
