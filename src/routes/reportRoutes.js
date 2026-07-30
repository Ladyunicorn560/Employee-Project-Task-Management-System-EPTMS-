const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const reportController = require('../controllers/reportController');

/**
 * All report routes require authentication.
 * RBAC is enforced inside the service layer.
 */

// Project Summary Report
router.get('/projects',      authenticate, reportController.getProjectReport);

// Employee Workload Report
router.get('/employees',     authenticate, reportController.getEmployeeReport);

// Task Status Report
router.get('/tasks',         authenticate, reportController.getTaskReport);

// Milestone Progress Report
router.get('/milestones',    authenticate, reportController.getMilestoneReport);

// Review History Report
router.get('/reviews',       authenticate, reportController.getReviewReport);

// Notification Summary Report
router.get('/notifications', authenticate, reportController.getNotificationReport);

module.exports = router;
