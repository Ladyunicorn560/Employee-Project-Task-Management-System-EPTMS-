/**
 * EPTMS Role Constants
 * Maps role names used throughout the application.
 * Must match the role names stored in the backend database.
 */

export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  PROJECT_MANAGER: 'Project Manager',
  EMPLOYEE: 'Employee',
  REVIEWER: 'Reviewer',
};

/** All available roles as an array */
export const ALL_ROLES = Object.values(ROLES);

/** Roles with administrative privileges */
export const ADMIN_ROLES = [ROLES.ADMINISTRATOR];

/** Roles with project management access */
export const MANAGER_ROLES = [ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER];

/** Roles that can review tasks/work */
export const REVIEWER_ROLES = [ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.REVIEWER];

/** All authenticated roles */
export const AUTHENTICATED_ROLES = ALL_ROLES;
