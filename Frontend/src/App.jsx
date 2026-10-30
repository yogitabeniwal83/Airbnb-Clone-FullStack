import { useEffect, useMemo, useState } from 'react'

import api from './api/axios'
import './App.css'
import LoginPage from './features/auth/LoginPage'
import SignupPage from './features/auth/SignupPage'
import NotFoundPage from './features/NotFoundPage'
import EditHomePage from './features/host/EditHomePage'
import HostHomeListPage from './features/host/HostHomeListPage'
import BookingsPage from './features/store/BookingsPage'
import FavouriteListPage from './features/store/FavouriteListPage'
import HomeDetailPage from './features/store/HomeDetailPage'
import LandingPage from './features/store/LandingPage'
import ReservePage from './features/store/ReservePage'
import { isGuestUser, isHostUser } from './utils/userAccess'

const LoadingScreen = ({ message = 'Loading Airbnb…' }) => (
  <div className="app-loading" role="status">
    <div className="app-spinner" />
    <p>{message}</p>
  </div>
)

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const path = useMemo(
    () => window.location.pathname.replace(/\/+$/, '') || '/',
    [],
  )

  const reserveMatch = path.match(/^\/homes\/([^/]+)\/reserve$/)
  const detailMatch = path.match(/^\/homes\/([^/]+)$/)
  const hostEditMatch = path.match(/^\/host\/edit-home\/([^/]+)$/)
  const isHostPath = path === '/host/host-home-list' || path === '/host/add-home' || Boolean(hostEditMatch)
  const isGuestPath = path === '/bookings' || path === '/favourites' || Boolean(reserveMatch)
  const needsAuthentication = isGuestPath || isHostPath

  useEffect(() => {
    let active = true

    api.get('/session')
      .then((response) => {
        if (active) {
          setUser(response.data.user || null)
        }
      })
      .catch(() => {
        if (active) {
          setUser(null)
        }
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!authLoading && needsAuthentication && !user) {
      const returnTo = `${window.location.pathname}${window.location.search}`
      window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
    }
  }, [authLoading, needsAuthentication, user])

  useEffect(() => {
    if (
      !authLoading
      && user
      && ((isHostPath && !isHostUser(user)) || (isGuestPath && !isGuestUser(user)))
    ) {
      window.location.replace('/')
    }
  }, [authLoading, isGuestPath, isHostPath, user])

  if (authLoading) {
    return <LoadingScreen />
  }

  if (needsAuthentication && !user) {
    return <LoadingScreen message="Taking you to login…" />
  }

  if (user && ((isHostPath && !isHostUser(user)) || (isGuestPath && !isGuestUser(user)))) {
    return <LoadingScreen message="Taking you back home…" />
  }

  if (path === '/login') {
    return <LoginPage onLogin={setUser} />
  }

  if (path === '/signup') {
    return <SignupPage />
  }

  if (path === '/' || path === '/homes') {
    return <LandingPage user={user} />
  }

  if (path === '/bookings') {
    return <BookingsPage user={user} />
  }

  if (path === '/favourites') {
    return <FavouriteListPage user={user} />
  }

  if (path === '/host/host-home-list') {
    return <HostHomeListPage user={user} />
  }

  if (path === '/host/add-home') {
    return <EditHomePage user={user} />
  }

  if (hostEditMatch) {
    return <EditHomePage user={user} homeId={decodeURIComponent(hostEditMatch[1])} />
  }

  if (reserveMatch) {
    return <ReservePage homeId={decodeURIComponent(reserveMatch[1])} user={user} />
  }

  if (detailMatch) {
    return <HomeDetailPage homeId={decodeURIComponent(detailMatch[1])} user={user} />
  }

  return <NotFoundPage user={user} />
}

export default App
