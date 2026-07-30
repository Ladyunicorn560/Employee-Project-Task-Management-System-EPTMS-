const AppError = require('./AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class ConflictError extends AppError {
  constructor(message = 'Resource conflict detected', errorCode = 'CONFLICT') {
    super(message, HTTP_STATUS.CONFLICT, errorCode);
  }
}

module.exports = ConflictError;
