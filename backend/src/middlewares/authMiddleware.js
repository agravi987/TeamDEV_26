const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const { User } = require('../models');

/**
 * Middleware to authenticate JWT from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authorization token missing or malformed', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return errorResponse(res, 'User not found or token is invalid', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired', 401);
    }
    return errorResponse(res, 'Invalid token', 401);
  }
};

/**
 * Middleware to authorize based on allowed roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authenticated', 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Requires one of: [${roles.join(', ')}]`,
        403
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
