/**
 * EPTMS Task, Milestone, and Project Workflow Lifecycle States
 */
const TASK_STATUS = Object.freeze({
  CREATED: 'Created',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  READY_FOR_REVIEW: 'Ready for Review',
  UNDER_REVIEW: 'Under Review',
  COMPLETED: 'Completed',
  CHANGES_REQUIRED: 'Changes Required',
  CANCELLED: 'Cancelled'
});

const PROJECT_STATUS = Object.freeze({
  DRAFT: 'Draft',
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived'
});

const MILESTONE_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
});

module.exports = {
  TASK_STATUS,
  PROJECT_STATUS,
  MILESTONE_STATUS
};
