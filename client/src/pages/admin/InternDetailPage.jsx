import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  Mail,
  Pencil,
  Phone,
  Timer,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button, { buttonClasses } from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import StatCard from '../../components/ui/StatCard';
import { InternStatusBadge, PriorityBadge, ReviewStatusBadge, TaskStatusBadge } from '../../components/ui/Badge';
import InfoItem from '../../components/ui/InfoItem';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { FullPageLoader } from '../../components/ui/Spinner';
import InternFormModal from '../../components/interns/InternFormModal';
import { getIntern } from '../../services/internService';
import { formatDate, isOverdue, relativeTime, truncate } from '../../utils/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function InternDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getIntern(id));
    } catch (requestError) {
      setError(requestError.message || 'Unable to load this intern.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const intern = data?.intern;
  useDocumentTitle(intern ? `${intern.name}` : 'Intern profile');

  if (loading) return <FullPageLoader label="Loading intern profile…" />;

  if (error) {
    return (
      <Card>
        <ErrorState
          title="Intern not available"
          message={error}
          onRetry={load}
        />
        <div className="pb-6 text-center">
          <Link to="/admin/interns" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            Back to interns
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/admin/interns')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition hover:text-ink-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to interns
      </button>

      <PageHeader
        title={intern.name}
        description={`${intern.department} · Joined ${formatDate(intern.joiningDate)}`}
        actions={
          <>
            <Link to={`/admin/tasks?internId=${intern.id}`} className={buttonClasses({ variant: 'secondary' })}>
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              View tasks
            </Link>
            <Button icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit intern
            </Button>
          </>
        }
      />

      <Card>
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={intern.name} size="lg" className="ring-4 ring-white shadow-card" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink-900">{intern.name}</h2>
              <InternStatusBadge status={intern.status} />
            </div>
            <p className="mt-1 text-sm text-ink-500">{intern.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
            <InfoItem icon={Mail} label="Email">
              <span className="break-all">{intern.email}</span>
            </InfoItem>
            <InfoItem icon={Phone} label="Phone">
              {intern.phone}
            </InfoItem>
            <InfoItem icon={BriefcaseBusiness} label="Department">
              {intern.department}
            </InfoItem>
            <InfoItem icon={CalendarDays} label="Joining date">
              {formatDate(intern.joiningDate)}
            </InfoItem>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total tasks" value={data.stats.totalTasks} icon={ListChecks} tone="brand" />
        <StatCard label="In progress" value={data.stats.inProgressTasks} icon={Timer} tone="info" />
        <StatCard
          label="Completed"
          value={data.stats.completedTasks}
          icon={CheckCircle2}
          tone="success"
          hint={`${data.stats.completionRate}% completion rate`}
        />
        <StatCard
          label="Submissions"
          value={data.stats.submissions}
          icon={ClipboardCheck}
          tone="violet"
          hint="All review attempts"
        />
      </div>

      <Card>
        <CardHeader title="Assigned tasks" description="The most recent work assigned to this intern." icon={ListChecks} />
        {data.tasks.length === 0 ? (
          <EmptyState
            compact
            icon={ListChecks}
            title="No tasks assigned"
            description="Assign a task from the task management page to get started."
            action={
              <Link to="/admin/tasks" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                Go to tasks
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Task</th>
                  <th className="hidden sm:table-cell">Deadline</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <p className="font-medium text-ink-800">{task.title}</p>
                      <p className="mt-0.5 text-xs text-ink-400">{truncate(task.description, 70)}</p>
                    </td>
                    <td className={`hidden whitespace-nowrap sm:table-cell ${isOverdue(task) ? 'font-medium text-rose-600' : ''}`}>
                      {formatDate(task.deadline)}
                    </td>
                    <td>
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td>
                      <TaskStatusBadge status={task.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Recent submissions"
          description="Submission attempts and their review outcome."
          icon={ClipboardCheck}
        />
        {data.recentSubmissions.length === 0 ? (
          <EmptyState
            compact
            icon={ClipboardCheck}
            title="No submissions yet"
            description="Submitted work will appear here along with the review status."
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.recentSubmissions.map((submission) => (
              <li key={submission.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-800">{submission.task?.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Attempt {submission.attempt} · submitted {relativeTime(submission.submittedAt)}
                  </p>
                  {submission.adminFeedback ? (
                    <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">
                      {submission.adminFeedback}
                    </p>
                  ) : null}
                </div>
                <ReviewStatusBadge status={submission.reviewStatus} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <InternFormModal
        open={editOpen}
        intern={intern}
        onClose={() => setEditOpen(false)}
        onSaved={(saved) => {
          setData((current) => ({ ...current, intern: saved }));
          load();
        }}
      />
    </div>
  );
}
