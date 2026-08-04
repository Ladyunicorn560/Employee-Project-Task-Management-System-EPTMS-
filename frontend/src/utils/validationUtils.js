/**
 * Validation Utilities
 * Reusable validation rules for React Hook Form.
 * Import these rules directly into useForm register calls.
 *
 * Usage:
 *   <TextField {...register('email', VALIDATION.email)} />
 */

// ─── Field Rules ──────────────────────────────────────────────────────────────

export const VALIDATION = {
  /** Required field rule */
  required: (label = 'This field') => ({
    required: `${label} is required`,
  }),

  /** Email validation */
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'Enter a valid email address',
    },
  },

  /** Password rules */
  password: {
    required: 'Password is required',
    minLength: { value: 6, message: 'Password must be at least 6 characters' },
  },

  /** Strong password (for change-password forms) */
  strongPassword: {
    required: 'Password is required',
    minLength: { value: 8, message: 'Password must be at least 8 characters' },
    validate: {
      hasUpperCase: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
      hasNumber: (v) => /\d/.test(v) || 'Must contain at least one number',
    },
  },

  /** Generic name field */
  name: {
    required: 'Name is required',
    minLength: { value: 2, message: 'Name must be at least 2 characters' },
    maxLength: { value: 100, message: 'Name must be under 100 characters' },
  },

  /** Phone number */
  phone: {
    pattern: {
      value: /^[+]?[\d\s\-().]{7,15}$/,
      message: 'Enter a valid phone number',
    },
  },

  /** Positive number */
  positiveNumber: {
    min: { value: 0, message: 'Value must be a positive number' },
  },

  /** Date range: end must be after start */
  endDateAfterStart: (startDate) => ({
    validate: (endDate) => {
      if (!endDate || !startDate) return true;
      return new Date(endDate) >= new Date(startDate) || 'End date must be after start date';
    },
  }),
};

// ─── Standalone Helpers ───────────────────────────────────────────────────────

/**
 * Check if an email string is valid.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

/**
 * Check if a string is empty or only whitespace.
 * @param {string|null|undefined} value
 * @returns {boolean}
 */
export const isEmpty = (value) =>
  value === null || value === undefined || String(value).trim() === '';

/**
 * Trim all string values in an object (useful before API calls).
 * @param {object} obj
 * @returns {object}
 */
export const trimObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
  );
};
