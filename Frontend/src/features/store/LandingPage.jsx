import { useContext, useEffect } from 'react'

import useHomes from '../../hooks/useHomes'
import useFavourites from '../../hooks/useFavourites'
import { HomeContext } from '../../state/homeState'
import { getHomePhotoUrl } from '../../utils/homePhoto'
import { isHostUser } from '../../utils/userAccess'
import FavouriteButton from '../partials/FavouriteButton'
import NavBar from '../partials/NavBar'

const LandingPage = ({ user }) => {
  const isHost = isHostUser(user)
  const { homes, setHomes } = useContext(HomeContext)
  const { data, loading, error } = useHomes()
  const {
    favouriteIds,
    loading: favouritesLoading,
    error: favouritesError,
    setFavouriteState,
  } = useFavourites(user)

  useEffect(() => {
    if (Array.isArray(data)) {
      setHomes(data)
    }
  }, [data, setHomes])

  const registeredHomes = homes.length > 0 ? homes : data

  return (
    <div className="landing-page-shell">
      <NavBar
        isLoggedIn={Boolean(user)}
        user={user}
        currentPage="Home"
      />

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1 className="landing-title">Find Your Perfect Stay</h1>
          <p className="landing-subtitle">
            Discover unique homes, apartments and villas around the world.
          </p>
        </div>
      </section>

      <main className="landing-main">
        <div className="landing-header-row">
          <div>
            <h2 className="landing-header-title">Featured Homes</h2>
            <p className="landing-header-copy">Hand-picked homes for your next trip.</p>
          </div>

          <span className="landing-count-badge">{registeredHomes.length} Homes</span>
        </div>

        {loading && <div className="page-message">Loading homes…</div>}

        {error && (
          <div className="page-error" role="alert">
            Unable to load homes. Make sure the backend is running and try again.
          </div>
        )}

        {favouritesError && (
          <div className="page-error favourite-load-error" role="alert">
            {favouritesError}
          </div>
        )}

        {!loading && !error && registeredHomes.length === 0 && (
          <div className="page-message">No homes are available right now.</div>
        )}

        {!loading && !error && <div className="landing-grid">
          {registeredHomes.map((home) => (
            <div key={home._id} className="landing-card">
              <div className="landing-card-image-wrap">
                {home.photo ? (
                  <img
                    src={getHomePhotoUrl(home.photo)}
                    alt={home.houseName}
                    className="landing-card-image"
                  />
                ) : (
                  <div className="home-image-placeholder">No image available</div>
                )}
                <div className="landing-rating-badge">⭐ {home.rating}</div>
                {!isHost && (
                  <FavouriteButton
                    homeId={home._id}
                    user={user}
                    initialIsFavourite={favouriteIds.includes(home._id)}
                    onChange={setFavouriteState}
                    variant="icon"
                    disabled={Boolean(user) && favouritesLoading}
                  />
                )}
              </div>

              <div className="landing-card-body">
                <h3 className="landing-card-title">{home.houseName}</h3>
                <p className="landing-card-location">📍 {home.location}</p>

                <div className="landing-price-row">
                  <div>
                    <span className="landing-price">₹{home.price}</span>
                    <span className="landing-price-unit"> / night</span>
                  </div>
                </div>

                <div className="landing-actions">
                  <a href={`/homes/${home._id}`} className="landing-view-btn">
                    View Details
                  </a>

                  {!isHost && (
                    <a
                      href={user
                        ? `/homes/${home._id}/reserve`
                        : `/login?returnTo=${encodeURIComponent(`/homes/${home._id}/reserve`)}`}
                      className="landing-book-btn"
                    >
                      Book Now
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>}
      </main>
    </div>
  )
}

export default LandingPage
