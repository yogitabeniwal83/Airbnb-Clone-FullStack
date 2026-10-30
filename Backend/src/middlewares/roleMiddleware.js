const { getActiveRole } = require('../utils/userRoles');

const requireRole = (role) => (req, res, next) => {
  if (!req.session?.isLoggedIn || !req.session?.user?._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (getActiveRole(req.session.user) === role) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'You are not authorized to perform this action',
  });
};

module.exports = { requireRole };
