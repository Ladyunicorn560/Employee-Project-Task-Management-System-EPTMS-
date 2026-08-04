/**
 * Storage Utilities
 * Generic localStorage/sessionStorage helpers beyond auth data.
 * For auth-specific storage, use tokenUtils.js instead.
 */

// ─── localStorage ─────────────────────────────────────────────────────────────

/**
 * Set a value in localStorage (auto-serializes objects).
 * @param {string} key
 * @param {*} value
 */
export const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[StorageUtils] lsSet failed for key "${key}":`, e);
  }
};

/**
 * Get a value from localStorage (auto-parses JSON).
 * @param {string} key
 * @param {*} fallback - Default value if key not found or parse fails
 * @returns {*}
 */
export const lsGet = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/**
 * Remove a key from localStorage.
 * @param {string} key
 */
export const lsRemove = (key) => {
  localStorage.removeItem(key);
};

/**
 * Clear all EPTMS-specific localStorage keys (prefixed with 'eptms_').
 */
export const lsClearApp = () => {
  const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith('eptms_'));
  keysToRemove.forEach((k) => localStorage.removeItem(k));
};

// ─── sessionStorage ───────────────────────────────────────────────────────────

/**
 * Set a value in sessionStorage.
 * @param {string} key
 * @param {*} value
 */
export const ssSet = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[StorageUtils] ssSet failed for key "${key}":`, e);
  }
};

/**
 * Get a value from sessionStorage.
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
export const ssGet = (key, fallback = null) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/**
 * Remove a key from sessionStorage.
 * @param {string} key
 */
export const ssRemove = (key) => {
  sessionStorage.removeItem(key);
};

// ─── App-level Preferences ────────────────────────────────────────────────────
// Keys for Phase 17 theme toggle and user preferences
export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'eptms_sidebar_collapsed',
  TABLE_PAGE_SIZE: 'eptms_table_page_size',
  THEME_MODE: 'eptms_theme_mode',        // Reserved for Phase 17
};
