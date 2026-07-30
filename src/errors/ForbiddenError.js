const AppError = require('./AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden: Insufficient permissions', errorCode = 'FORBIDDEN') {
    super(message, HTTP_STATUS.FORBIDDEN, errorCode);
  }
}

module.exports = ForbiddenError;
