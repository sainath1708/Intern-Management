import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, ListChecks, UserRound } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { createTask, updateTask } from '../../services/taskService';
import { PRIORITIES, TASK_STATUSES } from '../../utils/constants';
import { validateTaskForm } from '../../utils/validation';
import { dateInputToIso, toDateInputValue } from '../../utils/format';

const emptyForm = () => ({
  title: '',
  description: '',
  assignedTo: '',
  deadline: '',
  priority: 'Medium',
  status: 'Pending',
});

export default function TaskFormModal({ open, onClose, interns = [], task = null, onSaved }) {
  const isEdit = Boolean(task);
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const assignableInterns = useMemo(() => {
    const active = interns.filter((intern) => intern.status === 'active');
    if (task?.assignedTo && !active.some((intern) => intern.id === task.assignedTo.id)) {
      return [task.assignedTo, ...active];
    }
    return active;
  }, [interns, task]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setServerError('');
    setValues(
      task
        ? {
            title: task.title || '',
            description: task.description || '',
            assignedTo: task.assignedTo?.id || '',
            deadline: toDateInputValue(task.deadline),
            priority: task.priority || 'Medium',
            status: task.status || 'Pending',
          }
        : emptyForm(),
    );
  }, [open, task]);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateTaskForm(values, { isEdit });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      assignedTo: values.assignedTo,
      deadline: dateInputToIso(values.deadline),
      priority: values.priority,
    };

    if (isEdit) payload.status = values.status;

    setSaving(true);
    setServerError('');

    try {
      const saved = isEdit ? await updateTask(task.id, payload) : await createTask(payload);
      toast.success(isEdit ? 'Task updated' : 'Task created and assigned');
      onSaved?.(saved);
      onClose?.();
    } catch (error) {
      const fieldErrors = {};
      (error.errors || []).forEach((item) => {
        if (item.field) fieldErrors[item.field] = item.message;
      });
      setErrors((current) => ({ ...current, ...fieldErrors }));
      setServerError(error.message || 'Unable to save the task.');
    } finally {
      setSaving(false);
    }
  };

  const today = toDateInputValue(new Date());

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Edit task' : 'Create task'}
      description={isEdit ? 'Update the task details or reassign it.' : 'Assign work to an active intern with a clear deadline.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      {serverError ? (
        <Alert tone="danger" className="mb-5">
          {serverError}
        </Alert>
      ) : null}

      {assignableInterns.length === 0 ? (
        <Alert tone="warning" className="mb-5">
          There are no active interns available. Create or reactivate an intern before assigning tasks.
        </Alert>
      ) : null}

      <form id="task-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Task title"
          icon={ListChecks}
          placeholder="e.g. Build the reports page"
          value={values.title}
          onChange={update('title')}
          error={errors.title}
          maxLength={120}
          required
        />

        <Textarea
          label="Description"
          placeholder="Describe the expected outcome, acceptance criteria and any useful links."
          value={values.description}
          onChange={update('description')}
          error={errors.description}
          rows={5}
          maxLength={4000}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Assign to"
            icon={UserRound}
            value={values.assignedTo}
            onChange={update('assignedTo')}
            error={errors.assignedTo}
            required
          >
            <option value="">Select an intern</option>
            {assignableInterns.map((intern) => (
              <option key={intern.id} value={intern.id}>
                {intern.name} · {intern.department}
              </option>
            ))}
          </Select>

          <Input
            label="Deadline"
            type="date"
            icon={CalendarDays}
            min={isEdit ? undefined : today}
            value={values.deadline}
            onChange={update('deadline')}
            error={errors.deadline}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Priority" value={values.priority} onChange={update('priority')} error={errors.priority}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>

          {isEdit ? (
            <Select label="Status" value={values.status} onChange={update('status')} error={errors.status}>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          ) : (
            <div className="flex items-end pb-2 text-xs text-ink-500">
              New tasks always start as <span className="mx-1 font-semibold text-amber-700">Pending</span>.
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
