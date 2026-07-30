const AppError = require('./AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found', errorCode = 'NOT_FOUND') {
    super(message, HTTP_STATUS.NOT_FOUND, errorCode);
  }
}

module.exports = NotFoundError;
