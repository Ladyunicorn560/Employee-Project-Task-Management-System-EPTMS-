const crypto = require('crypto');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Attach or reuse correlation ID
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const userId = req.user ? req.user.userId : 'Anonymous';

    logger.http(`${method} ${originalUrl} ${statusCode} - ${duration}ms [ReqID: ${requestId}, IP: ${ip}, User: ${userId}]`);
  });

  next();
}

module.exports = requestLogger;
