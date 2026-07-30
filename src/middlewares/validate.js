const BadRequestError = require('../errors/BadRequestError');

function validate(schema) {
  return (req, res, next) => {
    const dataToValidate = {
      body: req.body,
      query: req.query,
      params: req.params
    };

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return next(new BadRequestError('Validation failed', 'INVALID_INPUT_PAYLOAD', formattedErrors));
    }

    // Assign sanitized data back to request
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;

    next();
  };
}

module.exports = validate;
