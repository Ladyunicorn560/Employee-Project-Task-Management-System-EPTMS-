const AppError = require('./AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', errorCode = 'UNAUTHORIZED') {
    super(message, HTTP_STATUS.UNAUTHORIZED, errorCode);
  }
}

module.exports = UnauthorizedError;
