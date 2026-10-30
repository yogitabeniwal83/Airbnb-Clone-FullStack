import { useEffect, useState } from 'react'

import api from '../../api/axios'
import { getHomePhotoUrl } from '../../utils/homePhoto'
import NavBar from '../partials/NavBar'

const HostHomeListPage = ({ user }) => {
  const [registeredHomes, setRegisteredHomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    api.get('/host/homes')
      .then((response) => {
        if (active) setRegisteredHomes(response.data.homes || [])
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || 'Unable to load hosted homes.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleDelete = async (homeId) => {
    if (!window.confirm('Are you sure you want to delete this home?')) return

    try {
      await api.delete(`/host/delete-home/${homeId}`)
      setRegisteredHomes((homes) => homes.filter((home) => home._id !== homeId))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this home.')
    }
  }

  return (
    <div className="host-home-list-page">
      <NavBar isLoggedIn user={user} currentPage="host-homes" />
      <main className="host-home-list-main">
        <div className="host-home-heading-row">
          <div className="host-home-heading">
            <h1>🏠 Your Hosted Homes</h1>
            <p>Manage, edit and track all your listed properties.</p>
          </div>
          <a href="/host/add-home" className="host-add-home-btn">+ Add Home</a>
        </div>

        {error && <div className="page-error" role="alert">{error}</div>}
        {loading && <div className="host-home-loading" role="status">Loading your homes...</div>}

        {!loading && !error && registeredHomes.length === 0 && (
          <div className="host-home-empty-state">
            <div className="host-home-empty-icon">🏡</div>
            <h2>No homes listed yet</h2>
            <p>Start hosting by adding your first property.</p>
            <a href="/host/add-home" className="host-add-home-btn">+ Add Home</a>
          </div>
        )}

        {!loading && !error && registeredHomes.length > 0 && (
          <div className="host-home-grid">
            {registeredHomes.map((home) => (
              <div className="host-home-card" key={home._id || home.id}>
                <div className="host-home-image-wrap">
                  {home.photo ? (
                    <img src={getHomePhotoUrl(home.photo)} alt={home.houseName} className="host-home-image" />
                  ) : (
                    <div className="host-home-image-placeholder">No image available</div>
                  )}
                </div>

                <div className="host-home-content">
                  <h2>{home.houseName}</h2>
                  <div className="host-home-meta-row">
                    <p className="host-home-location">📍 {home.location}</p>
                    <span className="host-home-rating">⭐ {home.rating}</span>
                  </div>
                  <div className="host-home-price-row">
                    <span className="host-home-price">₹{home.price}</span>
                    <span className="host-home-price-label">/ night</span>
                  </div>
                  <div className="host-home-actions">
                    <a href={`/homes/${home._id}`} className="host-view-btn">View Details</a>
                    <a href={`/host/edit-home/${home._id}`} className="host-edit-btn">Edit</a>
                    <button type="button" onClick={() => handleDelete(home._id)} className="host-delete-btn">
                      Delete
                    </button>
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

export default HostHomeListPage
