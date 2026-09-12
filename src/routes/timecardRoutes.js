const express = require('express');
const timecardController = require('../controllers/timecardController');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../constants/roles');
const {
  submitTimecardSchema,
  approvalSchema,
  getTimecardQuerySchema
} = require('../validators/timecardValidators');

const router = express.Router();

router.use(authenticate);

// Submit timecard
router.post(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(submitTimecardSchema),
  timecardController.submitTimecard
);

// List timecards
router.get(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(getTimecardQuerySchema),
  timecardController.getTimecards
);

// Missing timecards list
router.get(
  '/missing',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  timecardController.getMissingTimecards
);

// Project Billing summary for project owners / manager / admin
router.get(
  '/projects/:projectId/billing',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.REVIEWER),
  timecardController.getProjectBillingSummary
);

// Get single timecard details
router.get(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  timecardController.getTimecardById
);

// Resubmit / Edit rejected timecard
router.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(submitTimecardSchema),
  timecardController.updateTimecard
);

// Level 1: Manager Approval
router.post(
  '/:id/manager-approve',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(approvalSchema),
  timecardController.approveManager
);

// Level 1: Manager Rejection
router.post(
  '/:id/manager-reject',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(approvalSchema),
  timecardController.rejectManager
);

// Level 2: Project Owner Financial Approval
router.post(
  '/:id/financial-approve',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(approvalSchema),
  timecardController.approveFinancial
);

// Level 2: Project Owner Financial Rejection
router.post(
  '/:id/financial-reject',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(approvalSchema),
  timecardController.rejectFinancial
);

module.exports = router;
