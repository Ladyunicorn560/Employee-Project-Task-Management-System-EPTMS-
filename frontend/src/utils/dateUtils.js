/**
 * Date Utilities
 * Centralized date formatting and manipulation helpers.
 * Uses native Intl API — no external date library needed for Phase 1.
 */

/**
 * Format a date string or Date object into a readable locale string.
 * Example: "Aug 4, 2026"
 * @param {string|Date|null} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  } catch {
    return '—';
  }
};

/**
 * Format a date string with time.
 * Example: "Aug 4, 2026, 11:45 PM"
 * @param {string|Date|null} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return '—';
  }
};

/**
 * Get a relative time string.
 * Example: "3 days ago", "in 2 hours"
 * @param {string|Date|null} date
 * @returns {string}
 */
export const timeAgo = (date) => {
  if (!date) return '—';
  try {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diffMs = new Date(date) - new Date();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, 'day');
    if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, 'hour');
    return rtf.format(diffMins, 'minute');
  } catch {
    return '—';
  }
};

/**
 * Check if a date is overdue (in the past).
 * @param {string|Date|null} date
 * @returns {boolean}
 */
export const isOverdue = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

/**
 * Calculate days remaining until a due date.
 * Returns negative number if overdue.
 * @param {string|Date|null} date
 * @returns {number|null}
 */
export const daysRemaining = (date) => {
  if (!date) return null;
  const diffMs = new Date(date) - new Date();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Format a date for HTML date inputs (YYYY-MM-DD).
 * @param {string|Date|null} date
 * @returns {string}
 */
export const toInputDate = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return '';
  }
};
