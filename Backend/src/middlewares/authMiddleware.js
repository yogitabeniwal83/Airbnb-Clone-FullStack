const { toSessionUser } = require('../utils/userRoles');

module.exports = (req, res, next) => {
  if (req.session && req.session.isLoggedIn && req.session.user?._id) {
    req.session.user = toSessionUser(req.session.user);
    return next();
  }

  return res.status(401).json({
    message: "Unauthorized. Please login first."
  });
};
