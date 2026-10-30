import { useEffect, useState } from 'react'

import api from '../../api/axios'
import useFavourites from '../../hooks/useFavourites'
import { getHomePhotoUrl } from '../../utils/homePhoto'
import { isHostUser } from '../../utils/userAccess'
import NavBar from '../partials/NavBar'
import FavouriteButton from '../partials/FavouriteButton'

const features = [
  '📶 Free WiFi',
  '🚗 Parking',
  '🍽️ Kitchen',
  '❄️ Air Conditioning',
  '📺 Smart TV',
  '🏊 Swimming Pool',
  '🐶 Pet Friendly',
  '🛡️ 24×7 Security',
]

const HomeDetailPage = ({ homeId, user }) => {
  const isHost = isHostUser(user)
  const [home, setHome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const {
    favouriteIds,
    loading: favouritesLoading,
    error: favouritesError,
    setFavouriteState,
  } = useFavourites(user)

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

  if (loading) {
    return <div className="page-message full-page-message">Loading home…</div>
  }

  if (error || !home) {
    return (
      <div className="home-detail-shell">
        <NavBar isLoggedIn={Boolean(user)} user={user} currentPage="Home" />
        <div className="page-error detail-error">{error || 'Home not found.'}</div>
      </div>
    )
  }

  return (
    <div className="home-detail-shell">
      <NavBar
        isLoggedIn={Boolean(user)}
        user={user}
        currentPage="Home"
      />

      <main className="home-detail-page">
        <div className="home-detail-header">
          <h1 className="home-detail-title">{home.houseName}</h1>

          <div className="home-detail-meta">
            <span>⭐ {home.rating}</span>
            <span>📍 {home.location}</span>
          </div>
        </div>

        <div className="home-detail-layout">
          <div className="home-detail-main-column">
            <div className="home-detail-image-wrap">
              {home.photo ? (
                <img
                  src={getHomePhotoUrl(home.photo)}
                  alt={home.houseName}
                  className="home-detail-image"
                />
              ) : (
                <div className="home-image-placeholder">No image available</div>
              )}
            </div>

            <div className="home-detail-description-box">
              <h2 className="home-detail-section-title">About this place</h2>
              <p className="home-detail-description">{home.description}</p>
            </div>
          </div>

          <aside className="home-detail-sidebar">
            <div className="home-detail-card">
              <div className="home-detail-price-row">
                <div>
                  <span className="home-detail-price">₹{home.price}</span>
                  <span className="home-detail-price-unit"> / night</span>
                </div>

                <div className="home-detail-rating-inline">⭐ {home.rating}</div>
              </div>

              <div className="home-detail-info-list">
                <div className="home-detail-info-item">
                  <span className="home-detail-info-label">Location</span>
                  <span className="home-detail-info-value">{home.location}</span>
                </div>

                <div className="home-detail-info-item">
                  <span className="home-detail-info-label">Rating</span>
                  <span className="home-detail-info-value">{home.rating}/5</span>
                </div>
              </div>

              {!isHost && <div className="home-detail-actions">
                <a
                  href={user
                    ? `/homes/${home._id}/reserve`
                    : `/login?returnTo=${encodeURIComponent(`/homes/${home._id}/reserve`)}`}
                  className="reserve-now-btn"
                >
                  Reserve Now
                </a>

                <div className="home-detail-fave-wrap">
                  <FavouriteButton
                    homeId={home._id}
                    user={user}
                    initialIsFavourite={favouriteIds.includes(home._id)}
                    onChange={setFavouriteState}
                    disabled={Boolean(user) && favouritesLoading}
                  />
                </div>
                {favouritesError && (
                  <div className="favourite-inline-error" role="alert">{favouritesError}</div>
                )}
              </div>}
            </div>
          </aside>
        </div>

        <div className="home-detail-features-box">
          <h2 className="home-detail-section-title">What this place offers</h2>

          <div className="home-detail-features-grid">
            {features.map((feature) => (
              <div key={feature} className="home-detail-feature-item">
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomeDetailPage
