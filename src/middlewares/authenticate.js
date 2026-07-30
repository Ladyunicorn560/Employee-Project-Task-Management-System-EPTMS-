const { verifyToken } = require('../utils/jwt');
const UnauthorizedError = require('../errors/UnauthorizedError');
const logger = require('../utils/logger');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(`Unauthorized access attempt: Missing or malformed Authorization header [IP: ${req.ip}, Path: ${req.originalUrl}]`);
    return next(new UnauthorizedError('Missing or malformed Authorization header', 'MISSING_TOKEN'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { userId, email, roleId, roleName }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn(`Unauthorized access attempt: Expired JWT token [IP: ${req.ip}, Path: ${req.originalUrl}]`);
      return next(new UnauthorizedError('Token has expired. Please log in again.', 'TOKEN_EXPIRED'));
    }
    
    logger.warn(`Unauthorized access attempt: Invalid JWT token [IP: ${req.ip}, Path: ${req.originalUrl}]`);
    return next(new UnauthorizedError('Invalid authorization token.', 'INVALID_TOKEN'));
  }
}

module.exports = authenticate;
