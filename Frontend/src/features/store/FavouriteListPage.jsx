import { useEffect, useState } from 'react'

import api from '../../api/axios'
import { getHomePhotoUrl } from '../../utils/homePhoto'
import FavouriteButton from '../partials/FavouriteButton'
import NavBar from '../partials/NavBar'

const FavouriteListPage = ({ user }) => {
  const [favouriteHomes, setFavouriteHomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    api.get('/favourites')
      .then((response) => {
        if (active) {
          setFavouriteHomes(response.data.favourites || [])
        }
      })
      .catch((requestError) => {
        if (!active) {
          return
        }

        if (requestError.response?.status === 401) {
          window.location.assign('/login?returnTo=%2Ffavourites')
          return
        }

        setError(requestError.response?.data?.message || 'Unable to load favourites.')
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

  const handleFavouriteChange = (homeId, isFavourite) => {
    if (!isFavourite) {
      setFavouriteHomes((current) => current.filter((home) => home._id !== homeId))
    }
  }

  return (
    <div className="favourite-list-shell">
      <NavBar
        isLoggedIn={Boolean(user)}
        user={user}
        currentPage="favourites"
      />

      <main className="favourite-page">
        <div className="favourite-heading-wrap">
          <h1 className="favourite-heading">❤️ Your Favourite Homes</h1>
          <p className="favourite-subheading">All the homes you've saved for later.</p>
        </div>

        {error && <div className="page-error favourite-page-error" role="alert">{error}</div>}

        {loading && <div className="favourite-loading" role="status">Loading favourites...</div>}

        {!loading && !error && favouriteHomes.length === 0 && (
          <div className="favourite-empty-state">
            <div className="favourite-empty-icon">💔</div>
            <h2 className="favourite-empty-title">No favourite homes yet</h2>
            <p className="favourite-empty-text">Start exploring and save homes you love.</p>
            <a href="/homes" className="favourite-explore-btn">
              Explore Homes
            </a>
          </div>
        )}

        {!loading && !error && favouriteHomes.length > 0 && (
          <div className="favourite-grid">
            {favouriteHomes.map((home) => (
              <div key={home._id} className="favourite-card">
                <div className="favourite-card-image-wrap">
                  {home.photo ? (
                    <img
                      src={getHomePhotoUrl(home.photo)}
                      alt={home.houseName}
                      className="favourite-card-image"
                    />
                  ) : (
                    <div className="home-image-placeholder favourite-card-image">No image available</div>
                  )}
                  <div className="favourite-rating-badge">⭐ {home.rating}</div>
                </div>

                <div className="favourite-card-body">
                  <h2 className="favourite-card-title">{home.houseName}</h2>
                  <p className="favourite-card-location">📍 {home.location}</p>

                  <div className="favourite-price-row">
                    <span className="favourite-price">₹{home.price}</span>
                    <span className="favourite-price-unit">/ night</span>
                  </div>

                  <div className="favourite-actions">
                    <a href={`/homes/${home._id}`} className="favourite-view-btn">
                      View Details
                    </a>

                    <FavouriteButton
                      homeId={home._id}
                      user={user}
                      initialIsFavourite={true}
                      onChange={handleFavouriteChange}
                      variant="remove"
                      className="favourite-remove-btn"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default FavouriteListPage
