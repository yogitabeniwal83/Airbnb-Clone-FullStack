const VALID_ROLES = ['guest', 'host'];

const getUserRoles = (user) => {
  const roles = Array.isArray(user?.roles)
    ? user.roles.filter((role) => VALID_ROLES.includes(role))
    : [];

  if (VALID_ROLES.includes(user?.userType)) {
    roles.push(user.userType);
  }

  // Keep the guest role in the stored role set for backward compatibility.
  // Authorization uses getActiveRole, where host mode takes precedence.
  roles.push('guest');

  return VALID_ROLES.filter((role) => roles.includes(role));
};

const getActiveRole = (user) => (
  getUserRoles(user).includes('host') ? 'host' : 'guest'
);

const toSessionUser = (user) => ({
  _id: user?._id?.toString?.() || user?._id,
  firstName: user?.firstName,
  lastName: user?.lastName,
  email: user?.email,
  roles: getUserRoles(user),
  userType: getActiveRole(user),
});

module.exports = {
  VALID_ROLES,
  getActiveRole,
  getUserRoles,
  toSessionUser,
};
