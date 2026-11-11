export const cn = (...values) => values.filter(Boolean).join(' ');

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
};

/** yyyy-mm-dd for <input type="date">. */
export const toDateInputValue = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

/** Converts a date-only input value to midday local time so the date stays stable. */
export const dateOnlyToIso = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** Converts a date input value to an ISO string at 18:00 local time. */
export const dateInputToIso = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T18:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const relativeTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);

  if (Math.abs(minutes) < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 7) return `${Math.round(minutes / (60 * 24))}d ago`;
  return formatDate(date);
};

export const isOverdue = (task) => {
  if (!task?.deadline || task.status === 'Completed') return false;
  return new Date(task.deadline).getTime() < Date.now();
};

export const isDueSoon = (task, days = 3) => {
  if (!task?.deadline || task.status === 'Completed' || isOverdue(task)) return false;
  const diff = new Date(task.deadline).getTime() - Date.now();
  return diff <= days * 24 * 60 * 60 * 1000;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

const AVATAR_TONES = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
];

export const avatarTone = (name = '') => {
  const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
};

/** Trims text for table previews without breaking words. */
export const truncate = (value = '', length = 90) =>
  value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
