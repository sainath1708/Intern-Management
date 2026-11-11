/** Basic, practical email shape check (Mongoose also validates it). */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Indian mobile numbers: optional +91 prefix, then a 10 digit number starting
 * with 6-9. Spaces, dashes and a single separator group are tolerated, e.g.
 * +91 98765 43210, 9876543210, 09876543210 is intentionally not accepted.
 */
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

/** Normalises a phone number to +91XXXXXXXXXX for storage-independent checks. */
export const normalizePhone = (value = '') => value.replace(/[\s-]/g, '');
