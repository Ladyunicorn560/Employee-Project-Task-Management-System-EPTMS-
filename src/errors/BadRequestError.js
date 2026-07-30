const AppError = require('./AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errorCode = 'BAD_REQUEST', errors = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, errorCode, errors);
  }
}

module.exports = BadRequestError;
