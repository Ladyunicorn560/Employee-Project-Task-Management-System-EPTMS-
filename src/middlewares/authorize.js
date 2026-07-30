const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');

/**
 * Role-Based Access Control (RBAC) authorization middleware
 * @param  {...string} allowedRoles - List of allowed role names (e.g. 'Administrator', 'Project Manager')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roleName) {
      logger.warn(`Forbidden access attempt: Unverified user identity [IP: ${req.ip}, Path: ${req.originalUrl}]`);
      return next(new ForbiddenError('User identity not verified for authorization check'));
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      logger.warn(`Forbidden access attempt: Role '${req.user.roleName}' not authorized for ${req.method} ${req.originalUrl} [User: ${req.user.email}]`);
      return next(new ForbiddenError(`Access denied. Role '${req.user.roleName}' is not authorized for this action.`));
    }

    next();
  };
}

module.exports = authorize;
