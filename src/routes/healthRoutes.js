const express = require('express');
const router = express.Router();
const { checkDatabaseHealth } = require('../config/db');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * @route GET /api/v1/health
 * @desc System health check endpoint verifying server & SQL Server database status
 * @access Public
 */
router.get('/health', async (req, res, next) => {
  try {
    const dbHealth = await checkDatabaseHealth();

    if (!dbHealth) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: 'System Health Check Failed: Unable to connect to SQL Server database',
        timestamp: new Date().toISOString(),
        services: {
          server: 'UP',
          database: 'DOWN'
        }
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      status: HTTP_STATUS.OK,
      message: 'EPTMS Backend API is operating normally',
      timestamp: new Date().toISOString(),
      services: {
        server: 'UP',
        database: 'UP',
        details: {
          serverName: dbHealth.ServerName,
          databaseName: dbHealth.DatabaseName
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
