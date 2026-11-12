export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const INDIAN_PHONE_REGEX = /^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;

export const isValidHttpUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const normalizePhone = (value = '') => value.replace(/[\s-]/g, '');
