import { DEPARTMENTS, PRIORITIES } from './constants';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const INDIAN_PHONE_REGEX = /^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;
const NAME_REGEX = /^[a-zA-Z][a-zA-Z\s.'-]*$/;

export const isValidHttpUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email?.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
};

export const validateInternForm = (values, { isEdit = false } = {}) => {
  const errors = {};

  if (!values.name?.trim()) errors.name = 'Full name is required';
  else if (values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  else if (!NAME_REGEX.test(values.name.trim())) errors.name = 'Name contains unsupported characters';

  if (!values.email?.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(values.email.trim())) errors.email = 'Enter a valid email address';

  if (!isEdit) {
    if (!values.password) errors.password = 'Initial password is required';
    else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters';
    else if (!/[a-z]/.test(values.password)) errors.password = 'Include at least one lowercase letter';
    else if (!/[A-Z]/.test(values.password)) errors.password = 'Include at least one uppercase letter';
    else if (!/\d/.test(values.password)) errors.password = 'Include at least one number';
  }

  if (!values.phone?.trim()) errors.phone = 'Phone number is required';
  else if (!INDIAN_PHONE_REGEX.test(values.phone.trim()))
    errors.phone = 'Enter a valid Indian mobile number (e.g. +91 98765 43210)';

  if (!values.department) errors.department = 'Department is required';
  else if (!DEPARTMENTS.includes(values.department)) errors.department = 'Select a valid department';

  if (!values.joiningDate) errors.joiningDate = 'Joining date is required';
  else if (Number.isNaN(new Date(values.joiningDate).getTime())) errors.joiningDate = 'Enter a valid date';

  return errors;
};

export const validateTaskForm = (values, { isEdit = false } = {}) => {
  const errors = {};

  if (!values.title?.trim()) errors.title = 'Task title is required';
  else if (values.title.trim().length < 3) errors.title = 'Title must be at least 3 characters';

  if (!values.description?.trim()) errors.description = 'Task description is required';
  else if (values.description.trim().length < 10) errors.description = 'Description must be at least 10 characters';

  if (!values.assignedTo) errors.assignedTo = 'Select an intern';

  if (!values.deadline) errors.deadline = 'Deadline is required';
  else {
    const deadline = new Date(`${values.deadline}T18:00:00`);
    if (Number.isNaN(deadline.getTime())) errors.deadline = 'Enter a valid date';
    else if (!isEdit && deadline.getTime() <= Date.now()) errors.deadline = 'Deadline cannot be in the past';
  }

  if (!PRIORITIES.includes(values.priority)) errors.priority = 'Select a priority';

  return errors;
};

export const validateSubmissionForm = (values) => {
  const errors = {};

  if (!values.description?.trim()) errors.description = 'Describe the work you completed';
  else if (values.description.trim().length < 10)
    errors.description = 'Description must be at least 10 characters';

  const github = values.githubUrl?.trim();
  const document = values.documentUrl?.trim();

  if (!github && !document) {
    errors.githubUrl = 'Provide at least one link: a GitHub URL or a document URL';
  }
  if (github && !isValidHttpUrl(github)) errors.githubUrl = 'Enter a valid HTTP or HTTPS URL';
  if (document && !isValidHttpUrl(document)) errors.documentUrl = 'Enter a valid HTTP or HTTPS URL';

  return errors;
};

export const validateReview = (reviewStatus, adminFeedback) => {
  const errors = {};
  if (reviewStatus === 'Needs Changes' && adminFeedback.trim().length < 10) {
    errors.adminFeedback = 'Explain what needs to change (minimum 10 characters)';
  }
  return errors;
};
