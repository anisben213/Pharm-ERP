const ApiError = require('../utils/ApiError');

// validateMiddleware({ body: zodSchema, params: zodSchema, query: zodSchema })
module.exports = (schemas) => (req, res, next) => {
  try {
    for (const key of ['body', 'params', 'query']) {
      if (schemas[key]) {
        const parsed = schemas[key].parse(req[key]);
        req[key] = parsed;
      }
    }
    next();
  } catch (err) {
    next(new ApiError(400, 'Validation error', err.errors || err.message));
  }
};
