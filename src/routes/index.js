const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');

// Mount API v1 Routes
router.use('/', healthRoutes);

module.exports = router;
