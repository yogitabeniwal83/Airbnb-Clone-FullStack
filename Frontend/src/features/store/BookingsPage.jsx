import { useEffect, useState } from 'react'

import api from '../../api/axios'
import { getHomePhotoUrl } from '../../utils/homePhoto'
import NavBar from '../partials/NavBar'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const formatDate = (date) => new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(date))

const BookingsPage = ({ user }) => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState('')

  useEffect(() => {
    let active = true

    api.get('/bookings')
      .then((response) => {
        if (active) {
          setBookings(response.data.bookings || [])
        }
      })
      .catch((requestError) => {
        if (requestError.response?.status === 401) {
          window.location.assign('/login?returnTo=%2Fbookings')
          return
        }

        if (active) {
          setError(requestError.response?.data?.message || 'Unable to load your bookings.')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) {
      return
    }

    setError('')
    setCancellingId(bookingId)

    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`)
      setBookings((current) => current.map((booking) => (
        booking._id === bookingId ? response.data.booking : booking
      )))
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        window.location.assign('/login?returnTo=%2Fbookings')
        return
      }

      setError(requestError.response?.data?.message || 'Unable to cancel the booking.')
    } finally {
      setCancellingId('')
    }
  }

  return (
    <div className="bookings-page-shell">
      <NavBar
        isLoggedIn={Boolean(user)}
        user={user}
        currentPage="bookings"
      />

      <main className="bookings-page">
        <div className="bookings-heading-wrap">
          <h1 className="bookings-title">My Bookings</h1>
          <p className="bookings-text">Your upcoming and past stays, all in one place.</p>
        </div>

        {error && <div className="bookings-error" role="alert">{error}</div>}

        {loading && <div className="bookings-loading">Loading your bookings…</div>}

        {!loading && bookings.length === 0 && (
          <div className="bookings-empty">
            <div className="bookings-empty-icon">🏡</div>
            <h2>No bookings yet</h2>
            <p>When you book a stay, it will appear here.</p>
            <a href="/homes" className="bookings-explore-btn">Explore Homes</a>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="bookings-grid">
            {bookings.map((booking) => {
              const home = booking.homeId
              const isCancelled = booking.status === 'cancelled'

              return (
                <article key={booking._id} className={`booking-card ${isCancelled ? 'cancelled' : ''}`}>
                  <div className="booking-image-wrap">
                    {home?.photo ? (
                      <img
                        src={getHomePhotoUrl(home.photo)}
                        alt={home.houseName}
                        className="booking-image"
                      />
                    ) : (
                      <div className="home-image-placeholder">Home unavailable</div>
                    )}
                    <span className={`booking-status ${booking.status}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="booking-content">
                    <div>
                      <h2 className="booking-home-name">{home?.houseName || 'Home no longer available'}</h2>
                      <p className="booking-location">📍 {home?.location || 'Location unavailable'}</p>
                    </div>

                    <dl className="booking-details">
                      <div><dt>Check-in</dt><dd>{formatDate(booking.checkIn)}</dd></div>
                      <div><dt>Check-out</dt><dd>{formatDate(booking.checkOut)}</dd></div>
                      <div><dt>Guests</dt><dd>{booking.guests}</dd></div>
                      <div><dt>Nights</dt><dd>{booking.totalNights}</dd></div>
                    </dl>

                    <div className="booking-price-row">
                      <span>{currencyFormatter.format(booking.pricePerNight)} / night</span>
                      <strong>Total: {currencyFormatter.format(booking.totalPrice)}</strong>
                    </div>

                    <p className="booking-created">Booked on {formatDate(booking.createdAt)}</p>

                    <div className="booking-actions">
                      {home ? (
                        <a href={`/homes/${home._id}`} className="booking-view-btn">View Home</a>
                      ) : (
                        <span className="booking-view-btn disabled">Home unavailable</span>
                      )}

                      {!isCancelled && (
                        <button
                          type="button"
                          className="booking-cancel-btn"
                          onClick={() => handleCancel(booking._id)}
                          disabled={cancellingId === booking._id}
                        >
                          {cancellingId === booking._id ? 'Cancelling…' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default BookingsPage
