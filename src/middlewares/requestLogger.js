const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const userId = req.user ? req.user.userId : 'Anonymous';

    logger.http(`${method} ${originalUrl} ${statusCode} - ${duration}ms [IP: ${ip}, User: ${userId}]`);
  });

  next();
}

module.exports = requestLogger;
