const { verifyToken } = require('../utils/jwt');
const UnauthorizedError = require('../errors/UnauthorizedError');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { userId, email, roleId, roleName }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired. Please log in again.', 'TOKEN_EXPIRED'));
    }
    return next(new UnauthorizedError('Invalid authorization token.', 'INVALID_TOKEN'));
  }
}

module.exports = authenticate;
