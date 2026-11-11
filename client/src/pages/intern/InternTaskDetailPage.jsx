import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Github,
  PlayCircle,
  Send,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button, { buttonClasses } from '../../components/ui/Button';
import { Badge, PriorityBadge, ReviewStatusBadge, TaskStatusBadge } from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import InfoItem from '../../components/ui/InfoItem';
import DeadlineCell from '../../components/tasks/DeadlineCell';
import SubmissionForm from '../../components/submissions/SubmissionForm';
import { FullPageLoader } from '../../components/ui/Spinner';
import { getTask, updateTaskStatus } from '../../services/taskService';
import { formatDate, formatDateTime, isOverdue } from '../../utils/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function InternTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getTask(id));
    } catch (requestError) {
      setError(requestError.message || 'Unable to load this task.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const task = data?.task;
  const submissions = data?.submissions || [];
  const latest = submissions[0];
  useDocumentTitle(task?.title || 'Task details');

  if (loading) return <FullPageLoader label="Loading task…" />;

  if (error) {
    return (
      <Card>
        <ErrorState title="Task not available" message={error} onRetry={load} />
        <div className="pb-6 text-center">
          <Link to="/intern/tasks" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            Back to my tasks
          </Link>
        </div>
      </Card>
    );
  }

  const needsChanges = latest?.reviewStatus === 'Needs Changes';
  const awaitingReview = latest?.reviewStatus === 'Submitted';
  const canSubmit = task.status !== 'Completed' && !awaitingReview;

  const handleStart = async () => {
    setStarting(true);
    try {
      await updateTaskStatus(task.id, 'In Progress');
      toast.success('Task moved to In Progress');
      await load();
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to update the task.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/intern/tasks')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition hover:text-ink-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to my tasks
      </button>

      <PageHeader
        title={task.title}
        description={`Assigned by Qubenix AI${task.createdAt ? ` · created ${formatDate(task.createdAt)}` : ''}`}
        actions={
          task.status === 'Pending' ? (
            <Button icon={PlayCircle} loading={starting} onClick={handleStart}>
              Start working
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <TaskStatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        {latest ? <ReviewStatusBadge status={latest.reviewStatus} /> : null}
        {isOverdue(task) ? <Badge tone="danger">Overdue</Badge> : null}
      </div>

      {needsChanges ? (
        <Alert tone="warning" title="Changes requested by your reviewer">
          <p className="whitespace-pre-line">{latest.adminFeedback || 'Please review the feedback and resubmit your work.'}</p>
          <p className="mt-2 text-xs">
            Requested {formatDateTime(latest.reviewedAt || latest.submittedAt)}. Update the task and submit a new
            attempt below.
          </p>
        </Alert>
      ) : null}

      {task.status === 'Completed' ? (
        <Alert tone="success" title="Task completed">
          Your submission was approved and this task is now closed. Great work.
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Task brief" description="What your administrator asked for." icon={Send} />
          <CardBody>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{task.description}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Details" icon={CalendarDays} />
          <CardBody className="space-y-5">
            <InfoItem icon={CalendarDays} label="Deadline">
              <DeadlineCell task={task} />
            </InfoItem>
            <InfoItem icon={Clock} label="Created">
              {formatDate(task.createdAt)}
            </InfoItem>
            <InfoItem icon={Send} label="Submission attempts">
              {submissions.length}
            </InfoItem>
            <InfoItem icon={CheckCircle2} label="Current status">
              <TaskStatusBadge status={task.status} />
            </InfoItem>
          </CardBody>
        </Card>
      </div>

      {canSubmit ? (
        <Card>
          <CardHeader
            title={needsChanges ? 'Resubmit your work' : 'Submit your work'}
            description={
              needsChanges
                ? 'Address the feedback and send a new attempt for review.'
                : 'Share a description and at least one work link.'
            }
            icon={Send}
          />
          <CardBody>
            <SubmissionForm task={task} isResubmission={submissions.length > 0} onSubmitted={load} />
          </CardBody>
        </Card>
      ) : awaitingReview ? (
        <Alert tone="info" title="Your submission is awaiting review">
          Your administrator will review attempt {latest.attempt} shortly. You can submit again once feedback is
          provided.
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Submission history"
          description="Every attempt, review status and piece of feedback."
        />
        {submissions.length === 0 ? (
          <EmptyState
            compact
            icon={Send}
            title="No submissions yet"
            description="Submit your work above to start the review process."
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {submissions.map((submission) => (
              <li key={submission.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral" dot={false}>
                      Attempt {submission.attempt}
                    </Badge>
                    <ReviewStatusBadge status={submission.reviewStatus} />
                    <span className="text-xs text-ink-400">{formatDateTime(submission.submittedAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {submission.githubUrl ? (
                      <a
                        href={submission.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        <Github className="h-3.5 w-3.5" aria-hidden="true" />
                        GitHub
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : null}
                    {submission.documentUrl ? (
                      <a
                        href={submission.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        Document
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>

                <p className="mt-2 whitespace-pre-line text-sm text-ink-600">{submission.description}</p>

                {submission.adminFeedback ? (
                  <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Admin feedback</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-ink-700">{submission.adminFeedback}</p>
                    {submission.reviewedAt ? (
                      <p className="mt-1 text-[11px] text-ink-400">
                        {submission.reviewedByName ? `${submission.reviewedByName} · ` : ''}
                        {formatDateTime(submission.reviewedAt)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
