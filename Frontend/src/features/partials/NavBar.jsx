import { useState } from 'react'

import api from '../../api/axios'
import { isGuestUser, isHostUser } from '../../utils/userAccess'

const NavBar = ({
  isLoggedIn = false,
  user = null,
  currentPage = 'Home',
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [activeUser, setActiveUser] = useState(user)
  const [isBecomingHost, setIsBecomingHost] = useState(false)
  const [roleError, setRoleError] = useState('')
  const isGuest = isGuestUser(activeUser)
  const isHost = isHostUser(activeUser)

  const handleBecomeHost = async () => {
    setIsBecomingHost(true)
    setRoleError('')

    try {
      const response = await api.post('/become-host')
      setActiveUser(response.data.user)
      window.location.assign('/host/host-home-list')
    } catch (error) {
      setRoleError(error.response?.data?.message || 'Unable to enable hosting.')
    } finally {
      setIsBecomingHost(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await api.post('/logout')
      window.location.assign('/login')
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="nav-header">
      <nav className="nav-bar">
        <a href="/" className="nav-brand">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="nav-logo"
            fill="currentColor"
          >
            <path d="M16 1.6c-1.4 0-2.7.8-3.4 2l-9.1 15.7c-.7 1.2-.7 2.8 0 4 .7 1.2 2 2 3.4 2h18.2c1.4 0 2.7-.8 3.4-2 .7-1.2.7-2.8 0-4L19.4 3.6c-.7-1.2-2-2-3.4-2zm0 4.4c.3 0 .6.2.8.5l7.8 13.5c.2.3.2.7 0 1-.2.3-.5.5-.8.5H8.2c-.3 0-.6-.2-.8-.5-.2-.3-.2-.7 0-1l7.8-13.5c.2-.3.5-.5.8-.5zm0 3.8c-1.8 0-3.2 1.4-3.2 3.2 0 .8.3 1.6.8 2.2l2.4 3 2.4-3c.5-.6.8-1.4.8-2.2 0-1.8-1.4-3.2-3.2-3.2z"/>
          </svg>
          <span className="nav-brand-text">Airbnb</span>
        </a>

        <div className="nav-search-wrap">
          <form action="/homes" method="GET" className="nav-search-form">
            <div className="nav-search-inner">
              <input
                type="text"
                name="search"
                placeholder="Where do you want to stay?"
                className="nav-search-input"
              />

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="nav-search-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>
        </div>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <a href="/homes" className={currentPage === 'Home' ? 'nav-link active' : 'nav-link'}>
                Homes
              </a>

              {isGuest && (
                <>
                  <a href="/favourites" className={currentPage === 'favourites' ? 'nav-link active' : 'nav-link'}>
                    ❤️ Favourites
                  </a>
                  <a href="/bookings" className={currentPage === 'bookings' ? 'nav-link active' : 'nav-link'}>
                    📅 Bookings
                  </a>
                </>
              )}

              {isHost && (
                <>
                  <a href="/host/host-home-list" className={currentPage === 'host-homes' ? 'nav-link active' : 'nav-link'}>
                    Host Homes
                  </a>
                  <a href="/host/add-home" className={currentPage === 'addHome' ? 'nav-link active' : 'nav-link'}>
                    ➕ Add Home
                  </a>
                </>
              )}

              {!isHost && (
                <button
                  type="button"
                  className="nav-become-host-btn"
                  onClick={handleBecomeHost}
                  disabled={isBecomingHost}
                >
                  {isBecomingHost ? 'Enabling hosting…' : 'Become a Host'}
                </button>
              )}

              <div className="nav-user-box">
                <div className="nav-user-avatar">
                  {activeUser?.firstName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button
                  type="button"
                  className="nav-logout-btn"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging out…' : 'Logout'}
                </button>
              </div>
              {roleError && <span className="nav-role-error" role="alert">{roleError}</span>}
            </>
          ) : (
            <>
              <a href="/login" className="nav-login-link">
                Login
              </a>
              <a href="/signup" className="nav-signup-btn">
                Sign Up
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default NavBar
