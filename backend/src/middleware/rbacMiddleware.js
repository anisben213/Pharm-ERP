const ApiError = require('../utils/ApiError');

// Usage: rbac('ADMIN', 'QUALITY_CONTROLLER')
module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authenticated'));
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden: insufficient role'));
  }
  next();
};
