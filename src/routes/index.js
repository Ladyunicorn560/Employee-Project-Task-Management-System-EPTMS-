const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const departmentRoutes = require('./departmentRoutes');

// Mount API v1 Routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);

module.exports = router;
