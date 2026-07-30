const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');

// Mount API v1 Routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);

module.exports = router;
