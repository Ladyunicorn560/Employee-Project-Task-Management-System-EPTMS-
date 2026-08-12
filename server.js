const app = require('./src/app');
const env = require('./src/config/env');
const { initializeDb, closeDb } = require('./src/config/db');
const logger = require('./src/utils/logger');
const reminderScheduler = require('./src/utils/reminderScheduler');

let server;

async function startServer() {
  try {
    // 1. Initialize SQL Server Connection Pool
    await initializeDb();

    // Start background reminder checks
    reminderScheduler.start();

    // 2. Start Express HTTP Server
    server = app.listen(env.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`🚀 EPTMS Backend API Server is running!`);
      logger.info(`📡 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Listening on: http://localhost:${env.PORT}`);
      logger.info(`🏥 Health Check: http://localhost:${env.PORT}/api/v1/health`);
      logger.info(`=======================================================`);
    });

    // 3. Configure HTTP server timeouts for production performance & stability
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.requestTimeout = 120000; // 2 minutes

  } catch (err) {
    logger.error('💥 Server startup failed due to database or initialization error:', err);
    process.exit(1);
  }
}

// Handle Graceful Shutdown
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await closeDb();
      process.exit(0);
    });
  } else {
    await closeDb();
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

startServer();
