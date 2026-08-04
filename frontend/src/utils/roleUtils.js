import { ROLES } from '../constants/roles';

/**
 * Role Utilities
 * Helper functions for role-based access checks.
 * Use these in ProtectedRoute, sidebar visibility, and component guards.
 */

/**
 * Check if a user has one of the allowed roles.
 * @param {object|null} user - User object with a `roleName` property
 * @param {string[]} allowedRoles - Array of allowed role names
 * @returns {boolean}
 */
export const hasRole = (user, allowedRoles) => {
  if (!user || !user.roleName) return false;
  return allowedRoles.includes(user.roleName);
};

/**
 * Check if the user is an Administrator.
 * @param {object|null} user
 * @returns {boolean}
 */
export const isAdmin = (user) => hasRole(user, [ROLES.ADMINISTRATOR]);

/**
 * Check if the user is a Project Manager or higher.
 * @param {object|null} user
 * @returns {boolean}
 */
export const isManager = (user) => hasRole(user, [ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER]);

/**
 * Check if the user is a Reviewer or higher.
 * @param {object|null} user
 * @returns {boolean}
 */
export const isReviewer = (user) =>
  hasRole(user, [ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.REVIEWER]);

/**
 * Get a user-friendly display label for a role name.
 * @param {string} roleName
 * @returns {string}
 */
export const getRoleLabel = (roleName) => {
  const labels = {
    [ROLES.ADMINISTRATOR]: 'Administrator',
    [ROLES.PROJECT_MANAGER]: 'Project Manager',
    [ROLES.EMPLOYEE]: 'Employee',
    [ROLES.REVIEWER]: 'Reviewer',
  };
  return labels[roleName] || roleName || 'Unknown';
};

/**
 * Get MUI chip color for a given role.
 * @param {string} roleName
 * @returns {'primary'|'secondary'|'default'|'warning'}
 */
export const getRoleColor = (roleName) => {
  const colors = {
    [ROLES.ADMINISTRATOR]: 'error',
    [ROLES.PROJECT_MANAGER]: 'primary',
    [ROLES.REVIEWER]: 'secondary',
    [ROLES.EMPLOYEE]: 'default',
  };
  return colors[roleName] || 'default';
};
