import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Github, Send } from 'lucide-react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { submitWork } from '../../services/taskService';
import { validateSubmissionForm } from '../../utils/validation';

const emptyForm = { description: '', githubUrl: '', documentUrl: '' };

export default function SubmissionForm({ task, onSubmitted, isResubmission = false }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateSubmissionForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');

    try {
      const submission = await submitWork(task.id, {
        description: values.description.trim(),
        githubUrl: values.githubUrl.trim(),
        documentUrl: values.documentUrl.trim(),
      });
      toast.success(isResubmission ? 'Revised work submitted for review' : 'Work submitted for review');
      setValues(emptyForm);
      onSubmitted?.(submission);
    } catch (error) {
      const fieldErrors = {};
      (error.errors || []).forEach((item) => {
        if (item.field) fieldErrors[item.field] = item.message;
      });
      setErrors((current) => ({ ...current, ...fieldErrors }));
      setServerError(error.message || 'Unable to submit your work.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}

      <Textarea
        label="Work description"
        placeholder="Summarise what you built, how it works and anything the reviewer should check."
        value={values.description}
        onChange={update('description')}
        error={errors.description}
        rows={5}
        maxLength={4000}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="GitHub repository URL"
          icon={Github}
          type="url"
          placeholder="https://github.com/…"
          value={values.githubUrl}
          onChange={update('githubUrl')}
          error={errors.githubUrl}
          hint="Optional if you provide a document link."
        />
        <Input
          label="Document URL"
          icon={FileText}
          type="url"
          placeholder="https://docs.google.com/…"
          value={values.documentUrl}
          onChange={update('documentUrl')}
          error={errors.documentUrl}
          hint="Report, Figma file or design document."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
        <p className="text-xs text-ink-500">At least one link is required. Your submission is reviewed by an admin.</p>
        <Button type="submit" icon={Send} loading={submitting}>
          {isResubmission ? 'Submit revised work' : 'Submit work'}
        </Button>
      </div>
    </form>
  );
}
