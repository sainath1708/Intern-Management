import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  MessageSquareWarning,
  Timer,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardHeader } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { ReviewStatusBadge, TaskStatusBadge, PriorityBadge, OverdueBadge } from '../../components/ui/Badge';
import { buttonClasses } from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats } from '../../services/dashboardService';
import { formatDate, isOverdue, relativeTime, truncate } from '../../utils/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function InternDashboardPage() {
  useDocumentTitle('My dashboard');
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
      setError(requestError.message || 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const department = user?.intern?.department;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`Your assigned work${department ? ` in ${department}` : ''} and the latest review feedback.`}
        actions={
          <Link to="/intern/tasks" className={buttonClasses({ variant: 'primary' })}>
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            View my tasks
          </Link>
        }
      />

      {error ? (
        <Card>
          <ErrorState title="Dashboard unavailable" message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total tasks"
              value={stats?.totalTasks}
              icon={ListChecks}
              tone="brand"
              hint="Assigned to you"
              loading={loading && !stats}
              to="/intern/tasks"
            />
            <StatCard
              label="In progress"
              value={stats?.inProgressTasks}
              icon={Timer}
              tone="info"
              hint="Keep going"
              loading={loading && !stats}
            />
            <StatCard
              label="Completed"
              value={stats?.completedTasks}
              icon={CheckCircle2}
              tone="success"
              hint={stats ? `${stats.completionRate}% completion rate` : 'Approved work'}
              loading={loading && !stats}
            />
            <StatCard
              label="Needs changes"
              value={stats?.needsChanges}
              icon={MessageSquareWarning}
              tone="warning"
              hint="Review feedback"
              loading={loading && !stats}
            />
          </div>

          {stats?.needsChanges > 0 ? (
            <Alert tone="warning" title="Some of your work needs changes">
              Your administrator requested updates on {stats.needsChanges} submission
              {stats.needsChanges > 1 ? 's' : ''}. Open the task to read the feedback and resubmit.
            </Alert>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader
                title="Upcoming deadlines"
                description="Your next tasks that are still open."
                icon={CalendarClock}
                action={
                  <Link
                    to="/intern/tasks"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    All tasks
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                }
              />
              {loading && !stats ? (
                <TableSkeleton rows={3} columns={3} />
              ) : stats?.upcomingTasks?.length ? (
                <ul className="divide-y divide-ink-100">
                  {stats.upcomingTasks.map((task) => (
                    <li key={task.id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/intern/tasks/${task.id}`}
                            className="text-sm font-semibold text-ink-800 hover:text-brand-700"
                          >
                            {task.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-500">{truncate(task.description, 90)}</p>
                        </div>
                        <TaskStatusBadge status={task.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                        <PriorityBadge priority={task.priority} />
                        <span className={isOverdue(task) ? 'font-medium text-rose-600' : ''}>
                          Due {formatDate(task.deadline)}
                        </span>
                        {isOverdue(task) ? <OverdueBadge /> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  compact
                  icon={CheckCircle2}
                  title="You are all caught up"
                  description="You have no open tasks right now. New assignments will appear here."
                  action={
                    <Link to="/intern/tasks" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                      Open my tasks
                    </Link>
                  }
                />
              )}
            </Card>

            <Card>
              <CardHeader
                title="Recent submissions"
                description="Review status of your latest work."
                icon={ClipboardCheck}
              />
              {loading && !stats ? (
                <TableSkeleton rows={3} columns={2} />
              ) : stats?.recentSubmissions?.length ? (
                <ul className="divide-y divide-ink-100">
                  {stats.recentSubmissions.map((submission) => (
                    <li key={submission.id} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/intern/tasks/${submission.task?.id}`}
                          className="text-sm font-semibold text-ink-800 hover:text-brand-700"
                        >
                          {submission.task?.title}
                        </Link>
                        <ReviewStatusBadge status={submission.reviewStatus} />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-400">
                        Attempt {submission.attempt} · {relativeTime(submission.submittedAt)}
                      </p>
                      {submission.adminFeedback ? (
                        <p className="mt-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600">
                          {truncate(submission.adminFeedback, 110)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  compact
                  icon={ClipboardCheck}
                  title="Nothing submitted yet"
                  description="Start a task and submit your work to see its review status here."
                />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
