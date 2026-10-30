export const getActiveUserRole = (user) => {
  if (!user) return null

  if (user.userType === 'host' || user.roles?.includes('host')) {
    return 'host'
  }

  if (user.userType === 'guest' || user.roles?.includes('guest')) {
    return 'guest'
  }

  return null
}

export const isGuestUser = (user) => getActiveUserRole(user) === 'guest'
export const isHostUser = (user) => getActiveUserRole(user) === 'host'
