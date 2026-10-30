import { useEffect, useState } from 'react'

import api from '../../api/axios'
import { getHomePhotoUrl } from '../../utils/homePhoto'
import NavBar from '../partials/NavBar'

const getToday = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) {
    return 0
  }

  const start = Date.parse(`${checkIn}T00:00:00Z`)
  const end = Date.parse(`${checkOut}T00:00:00Z`)
  const nights = (end - start) / (24 * 60 * 60 * 1000)
  return Number.isInteger(nights) && nights > 0 ? nights : 0
}

const ReservePage = ({ homeId, user }) => {
  const [home, setHome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: '2',
  })
  const [today] = useState(() => getToday())
  const totalNights = getNights(formData.checkIn, formData.checkOut)
  const previewTotal = home ? totalNights * Number(home.price) : 0

  useEffect(() => {
    let active = true

    api.get(`/homes/${homeId}`)
      .then((response) => {
        if (active) {
          setHome(response.data)
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || 'Unable to load this home.')
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
  }, [homeId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!formData.checkIn || !formData.checkOut) {
      setError('Please choose both check-in and check-out dates.')
      return
    }

    if (totalNights < 1) {
      setError('Check-out must be after check-in.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post('/bookings', {
        homeId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: Number(formData.guests),
      })

      setSuccess(response.data.message || 'Booking confirmed successfully.')
      window.setTimeout(() => window.location.assign('/bookings'), 900)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        const returnTo = window.location.pathname
        window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`)
        return
      }

      setError(requestError.response?.data?.message || 'Unable to confirm your booking.')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="page-message full-page-message">Loading reservation…</div>
  }

  if (!home) {
    return (
      <div className="reserve-page-shell">
        <NavBar isLoggedIn={Boolean(user)} user={user} currentPage="Home" />
        <div className="page-error detail-error">{error || 'Home not found.'}</div>
      </div>
    )
  }

  return (
    <div className="reserve-page-shell">
      <NavBar
        isLoggedIn={Boolean(user)}
        user={user}
        currentPage="Home"
      />

      <main className="reserve-page">
        <div className="reserve-card">
          <div className="reserve-header">
            <h1 className="reserve-title">Reserve Your Stay</h1>
            <p className="reserve-subtitle">Complete your booking for {home.houseName}</p>
          </div>

          {home.photo && (
            <img
              src={getHomePhotoUrl(home.photo)}
              alt={home.houseName}
              className="reserve-home-image"
            />
          )}

          {error && <div className="reserve-alert error" role="alert">{error}</div>}
          {success && <div className="reserve-alert success" role="status">{success}</div>}

          <div className="reserve-summary-box">
            <div className="reserve-summary-row">
              <span className="reserve-label">Property</span>
              <span className="reserve-value">{home.houseName}</span>
            </div>
            <div className="reserve-summary-row">
              <span className="reserve-label">Location</span>
              <span className="reserve-value">{home.location}</span>
            </div>
            <div className="reserve-summary-row">
              <span className="reserve-label">Rating</span>
              <span className="reserve-value">⭐ {home.rating}</span>
            </div>
            <div className="reserve-summary-row total-row">
              <span className="reserve-label">Price per night</span>
              <span className="reserve-value">₹{home.price}/night</span>
            </div>
            <div className="reserve-summary-row">
              <span className="reserve-label">Nights</span>
              <span className="reserve-value">{totalNights || '—'}</span>
            </div>
            <div className="reserve-summary-row reserve-grand-total">
              <span className="reserve-label">Total amount</span>
              <span className="reserve-value">₹{previewTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <form className="reserve-form" onSubmit={handleSubmit}>
            <div className="reserve-field">
              <label htmlFor="checkin">Check-in</label>
              <input
                id="checkin"
                name="checkIn"
                type="date"
                min={today}
                value={formData.checkIn}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reserve-field">
              <label htmlFor="checkout">Check-out</label>
              <input
                id="checkout"
                name="checkOut"
                type="date"
                min={formData.checkIn || today}
                value={formData.checkOut}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reserve-field">
              <label htmlFor="guests">Guests</label>
              <select
                id="guests"
                name="guests"
                value={formData.guests}
                onChange={handleChange}
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
              </select>
            </div>

            <button
              type="submit"
              className="reserve-submit-btn"
              disabled={isSubmitting || Boolean(success)}
            >
              {isSubmitting ? 'Confirming…' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ReservePage
