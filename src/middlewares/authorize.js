const ForbiddenError = require('../errors/ForbiddenError');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roleName) {
      return next(new ForbiddenError('User identity not verified for authorization check'));
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      return next(new ForbiddenError(`Access denied. Role '${req.user.roleName}' is not authorized for this action.`));
    }

    next();
  };
}

module.exports = authorize;
