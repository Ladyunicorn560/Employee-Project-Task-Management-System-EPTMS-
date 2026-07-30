const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const departmentRoutes = require('./departmentRoutes');
const roleRoutes = require('./roleRoutes');
const projectRoutes = require('./projectRoutes');
const { directMilestonesRouter } = require('./milestoneRoutes');
const { directTasksRouter } = require('./taskRoutes');
const { directSubtasksRouter } = require('./subtaskRoutes');
const { directCommentsRouter } = require('./commentRoutes');
const { directAttachmentsRouter } = require('./attachmentRoutes');
const { directReviewsRouter } = require('./reviewRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');

// Mount API v1 Routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/roles', roleRoutes);
router.use('/projects', projectRoutes);
router.use('/milestones', directMilestonesRouter);
router.use('/tasks', directTasksRouter);
router.use('/subtasks', directSubtasksRouter);
router.use('/comments', directCommentsRouter);
router.use('/attachments', directAttachmentsRouter);
router.use('/reviews', directReviewsRouter);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
