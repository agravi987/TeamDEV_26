const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to handle express-validator validation results
 * Returns 422 with a formatted error list if any validations failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return errorResponse(res, 'Validation failed', 422, formatted);
  }
  next();
};

module.exports = { validate };
