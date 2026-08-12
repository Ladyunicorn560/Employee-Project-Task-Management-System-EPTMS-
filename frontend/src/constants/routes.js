/**
 * EPTMS Route Constants
 * Single source of truth for all application route paths.
 * Use these in <Link to={ROUTES.DASHBOARD}> and navigate(ROUTES.LOGIN).
 */

export const ROUTES = {
  // Public
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

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
  NOTIFICATIONS: '/notifications',

  // User
  PROFILE: '/profile',
  CONFIGURATION: '/configuration',
  CHANGE_PASSWORD: '/change-password',
  KANBAN: '/kanban',
  CALENDAR: '/calendar',
  AUDIT_LOGS: '/audit-logs',
  REVIEWS: '/reviews',

  // Errors
  ERROR_401: '/401',
  ERROR_403: '/403',
  ERROR_404: '/404',
  ERROR_500: '/500',
};
