/**
 * EPTMS Status Constants
 * Centralized status values for Projects, Tasks, Employees, etc.
 * Must match backend enum values exactly.
 */

// ─── Project Status ────────────────────────────────────────────────────────
export const PROJECT_STATUS = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ─── Task Status ───────────────────────────────────────────────────────────
export const TASK_STATUS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ─── Task Priority ─────────────────────────────────────────────────────────
export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

// ─── Employee Status ───────────────────────────────────────────────────────
export const EMPLOYEE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
  TERMINATED: 'Terminated',
};

// ─── Review Status ─────────────────────────────────────────────────────────
export const REVIEW_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CHANGES_REQUESTED: 'Changes Requested',
};

// ─── Milestone Status ──────────────────────────────────────────────────────
export const MILESTONE_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
};
