const env = require('./env');
const logger = require('../utils/logger');

// Load mssql module dynamically based on authentication type
let mssql;
if (env.DB_USER && env.DB_PASSWORD) {
  mssql = require('mssql');
} else {
  // Use native Windows Authentication driver
  mssql = require('mssql/msnodesqlv8');
}

let pool = null;

function getDbConfig() {
  if (env.DB_USER && env.DB_PASSWORD) {
    return {
      server: env.DB_SERVER,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      options: {
        encrypt: env.DB_ENCRYPT,
        trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
        enableArithAbort: true
      },
      pool: { max: 20, min: 5, idleTimeoutMillis: 30000 },
      connectionTimeout: 15000,
      requestTimeout: 30000
    };
  }

  // Windows Authentication Configuration via msnodesqlv8 / ODBC Driver
  return {
    connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${env.DB_SERVER};Database=${env.DB_NAME};Trusted_Connection=yes;TrustServerCertificate=${env.DB_TRUST_SERVER_CERTIFICATE ? 'yes' : 'no'};`,
    pool: { max: 20, min: 5, idleTimeoutMillis: 30000 },
    connectionTimeout: 15000,
    requestTimeout: 30000
  };
}

async function initializeDb() {
  if (pool) {
    return pool;
  }

  try {
    const config = getDbConfig();
    logger.info(`Connecting to SQL Server database '${env.DB_NAME}' on server '${env.DB_SERVER}'...`);
    
    pool = await new mssql.ConnectionPool(config).connect();
    
    pool.on('error', (err) => {
      logger.error('Database connection pool error:', err);
    });

    logger.info(`✅ SQL Server database connection established successfully [Server: ${env.DB_SERVER}, DB: ${env.DB_NAME}]`);
    return pool;
  } catch (err) {
    logger.error('❌ Failed to connect to SQL Server database:', err);
    throw err;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initializeDb() first.');
  }
  return pool;
}

async function checkDatabaseHealth() {
  try {
    if (!pool) return false;
    const request = pool.request();
    const result = await request.query('SELECT 1 AS HealthCheck, DB_NAME() AS DatabaseName, @@SERVERNAME AS ServerName');
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : false;
  } catch (err) {
    logger.error('Database health check query failed:', err);
    return false;
  }
}

async function closeDb() {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      logger.info('Database connection pool closed successfully.');
    } catch (err) {
      logger.error('Error closing database pool:', err);
    }
  }
}

module.exports = {
  initializeDb,
  getPool,
  checkDatabaseHealth,
  closeDb,
  mssql
};
