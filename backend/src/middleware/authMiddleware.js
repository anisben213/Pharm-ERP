const { verifyAccessToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

module.exports = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'Not authenticated');
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};
