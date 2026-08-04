/**
 * EPTMS Route Constants
 * Single source of truth for all application route paths.
 * Use these in <Link to={ROUTES.DASHBOARD}> and navigate(ROUTES.LOGIN).
 */

export const ROUTES = {
  // Public
  LOGIN: '/login',

  // Core
  ROOT: '/',
  DASHBOARD: '/dashboard',

  // People & Org
  EMPLOYEES: '/employees',
  DEPARTMENTS: '/departments',
  ROLES: '/roles',

  // Work Management
  PROJECTS: '/projects',
  MILESTONES: '/milestones',
  TASKS: '/tasks',

  // Reporting
  REPORTS: '/reports',

  // User
  PROFILE: '/profile',
  SETTINGS: '/settings',
  CHANGE_PASSWORD: '/change-password',

  // Errors
  ERROR_401: '/401',
  ERROR_403: '/403',
  ERROR_404: '/404',
  ERROR_500: '/500',
};
