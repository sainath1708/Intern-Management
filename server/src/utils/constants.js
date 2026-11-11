export const ROLES = Object.freeze({
  ADMIN: 'admin',
  INTERN: 'intern',
});

export const INTERN_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

export const INTERN_STATUSES = Object.values(INTERN_STATUS);

export const DEPARTMENTS = Object.freeze([
  'Engineering',
  'Design',
  'Data Science',
  'Marketing',
  'Operations',
  'Human Resources',
  'Business Development',
]);

export const PRIORITIES = Object.freeze(['Low', 'Medium', 'High']);

export const TASK_STATUS = Object.freeze({
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
});

export const TASK_STATUSES = Object.values(TASK_STATUS);

export const REVIEW_STATUS = Object.freeze({
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  NEEDS_CHANGES: 'Needs Changes',
});

export const REVIEW_STATUSES = Object.values(REVIEW_STATUS);

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
