import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, CalendarDays, KeyRound, Mail, Phone, UserRound } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { createIntern, updateIntern } from '../../services/internService';
import { DEPARTMENTS, INTERN_STATUSES } from '../../utils/constants';
import { validateInternForm } from '../../utils/validation';
import { dateOnlyToIso, toDateInputValue } from '../../utils/format';

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  phone: '',
  department: 'Engineering',
  joiningDate: toDateInputValue(new Date()),
  status: 'active',
});

export default function InternFormModal({ open, onClose, intern = null, onSaved }) {
  const isEdit = Boolean(intern);
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setServerError('');
    setValues(
      intern
        ? {
            name: intern.name || '',
            email: intern.email || '',
            password: '',
            phone: intern.phone || '',
            department: intern.department || 'Engineering',
            joiningDate: toDateInputValue(intern.joiningDate),
            status: intern.status || 'active',
          }
        : emptyForm(),
    );
  }, [open, intern]);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateInternForm(values, { isEdit });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      department: values.department,
      joiningDate: dateOnlyToIso(values.joiningDate),
      status: values.status,
    };

    if (!isEdit) payload.password = values.password;

    setSaving(true);
    setServerError('');

    try {
      const saved = isEdit ? await updateIntern(intern.id, payload) : await createIntern(payload);
      toast.success(isEdit ? 'Intern details updated' : 'Intern account created');
      onSaved?.(saved);
      onClose?.();
    } catch (error) {
      const fieldErrors = {};
      (error.errors || []).forEach((item) => {
        if (item.field) fieldErrors[item.field] = item.message;
      });
      setErrors((current) => ({ ...current, ...fieldErrors }));
      setServerError(error.message || 'Unable to save the intern.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Edit intern' : 'Add intern'}
      description={
        isEdit
          ? 'Update the intern profile and linked login account.'
          : 'Creates a login account and intern profile together.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="intern-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Create intern'}
          </Button>
        </>
      }
    >
      {serverError ? (
        <Alert tone="danger" className="mb-5">
          {serverError}
        </Alert>
      ) : null}

      <form id="intern-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            icon={UserRound}
            placeholder="e.g. Aarav Sharma"
            value={values.name}
            onChange={update('name')}
            error={errors.name}
            required
          />
          <Input
            label="Email address"
            type="email"
            icon={Mail}
            placeholder="intern@qubenix.ai"
            value={values.email}
            onChange={update('email')}
            error={errors.email}
            required
          />
        </div>

        {!isEdit ? (
          <Input
            label="Initial password"
            type="password"
            icon={KeyRound}
            placeholder="Minimum 8 characters"
            value={values.password}
            onChange={update('password')}
            error={errors.password}
            hint="At least 8 characters with an uppercase letter, a lowercase letter and a number."
            autoComplete="new-password"
            required
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone number"
            icon={Phone}
            placeholder="+91 98765 43210"
            value={values.phone}
            onChange={update('phone')}
            error={errors.phone}
            required
          />
          <Select
            label="Department"
            icon={Building2}
            value={values.department}
            onChange={update('department')}
            error={errors.department}
            required
          >
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Joining date"
            type="date"
            icon={CalendarDays}
            value={values.joiningDate}
            onChange={update('joiningDate')}
            error={errors.joiningDate}
            required
          />
          <Select label="Status" value={values.status} onChange={update('status')} error={errors.status}>
            {INTERN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === 'active' ? 'Active' : 'Inactive'}
              </option>
            ))}
          </Select>
        </div>

        {isEdit ? (
          <p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
            Passwords are managed securely and are never returned by the API. Contact a system administrator if
            credentials need to be reset.
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
