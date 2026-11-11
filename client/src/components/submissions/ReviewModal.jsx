import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ExternalLink, FileText, Github } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Textarea from '../ui/Textarea';
import Avatar from '../ui/Avatar';
import { Badge, ReviewStatusBadge } from '../ui/Badge';
import { reviewSubmission } from '../../services/submissionService';
import { validateReview } from '../../utils/validation';
import { formatDateTime } from '../../utils/format';

export default function ReviewModal({ open, submission, onClose, onReviewed }) {
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!open) return;
    setFeedback(submission?.adminFeedback || '');
    setErrors({});
    setConfirmAction(null);
    setServerError('');
  }, [open, submission]);

  if (!submission) return null;

  const isApproved = submission.reviewStatus === 'Approved';

  const startAction = (action) => {
    const validationErrors = validateReview(action, feedback);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setConfirmAction(action);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setSubmitting(true);
    setServerError('');

    try {
      await reviewSubmission(submission.id, {
        reviewStatus: confirmAction,
        adminFeedback: feedback.trim(),
      });
      toast.success(
        confirmAction === 'Approved'
          ? 'Submission approved and task completed'
          : 'Changes requested and feedback shared',
      );
      onReviewed?.();
      onClose?.();
    } catch (error) {
      setServerError(error.message || 'Unable to submit the review.');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = isApproved ? (
    <Button variant="secondary" onClick={onClose}>
      Close
    </Button>
  ) : confirmAction ? (
    <>
      <Button variant="secondary" onClick={() => setConfirmAction(null)} disabled={submitting}>
        Back
      </Button>
      <Button
        variant={confirmAction === 'Approved' ? 'success' : 'primary'}
        loading={submitting}
        onClick={handleConfirm}
      >
        {confirmAction === 'Approved' ? 'Confirm approval' : 'Confirm request'}
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
      <Button variant="secondary" onClick={() => startAction('Needs Changes')}>
        Request changes
      </Button>
      <Button variant="success" onClick={() => startAction('Approved')}>
        Approve submission
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title="Review submission"
      description="Inspect the work, then approve it or request changes with clear feedback."
      size="lg"
      footer={footer}
    >
      {serverError ? (
        <Alert tone="danger" className="mb-5">
          {serverError}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={submission.intern?.name} />
          <div>
            <p className="text-sm font-semibold text-ink-900">{submission.intern?.name}</p>
            <p className="text-xs text-ink-500">{submission.intern?.email}</p>
          </div>
        </div>
        <ReviewStatusBadge status={submission.reviewStatus} />
      </div>

      <div className="mt-5 rounded-xl border border-ink-200 bg-ink-50/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink-900">{submission.task?.title}</p>
          {submission.task?.priority ? <Badge tone="neutral">{submission.task.priority}</Badge> : null}
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Attempt {submission.attempt} · Submitted {formatDateTime(submission.submittedAt)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {submission.githubUrl ? (
            <a
              href={submission.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-ink-300 hover:text-ink-900"
            >
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
              GitHub repository
              <ExternalLink className="h-3 w-3 text-ink-400" aria-hidden="true" />
            </a>
          ) : null}
          {submission.documentUrl ? (
            <a
              href={submission.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-ink-300 hover:text-ink-900"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Document
              <ExternalLink className="h-3 w-3 text-ink-400" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Work description</p>
        <p className="mt-2 whitespace-pre-line rounded-xl border border-ink-100 bg-white p-4 text-sm leading-relaxed text-ink-700">
          {submission.description}
        </p>
      </div>

      {isApproved ? (
        <Alert tone="success" title="This submission has been approved" className="mt-5">
          The related task is marked as completed. Submission history is preserved for audit.
          {submission.adminFeedback ? <p className="mt-2">{submission.adminFeedback}</p> : null}
        </Alert>
      ) : (
        <div className="mt-5">
          <Textarea
            label={confirmAction === 'Needs Changes' ? 'Feedback for the intern' : 'Feedback (optional)'}
            placeholder="Explain what was done well and exactly what needs to change before approval."
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value);
              setErrors({});
            }}
            error={errors.adminFeedback}
            hint={
              confirmAction === 'Needs Changes'
                ? 'Required when requesting changes. The intern sees this immediately.'
                : 'Optional encouraging note stored with the review.'
            }
            maxLength={2000}
            rows={4}
          />

          {confirmAction ? (
            <Alert
              tone={confirmAction === 'Approved' ? 'success' : 'warning'}
              title={confirmAction === 'Approved' ? 'Confirm approval' : 'Confirm request for changes'}
              className="mt-4"
            >
              {confirmAction === 'Approved'
                ? 'Approving marks this task as Completed. The intern can no longer submit new work for it.'
                : 'The task stays In Progress and your feedback is shown on the intern dashboard so they can resubmit.'}
            </Alert>
          ) : null}
        </div>
      )}

      {isApproved ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Reviewed and closed
        </div>
      ) : null}
    </Modal>
  );
}
