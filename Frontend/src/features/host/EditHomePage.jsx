import { useEffect, useState } from 'react'

import api from '../../api/axios'
import NavBar from '../partials/NavBar'

const EditHomePage = ({ user, homeId = null }) => {
  const [formData, setFormData] = useState({
    houseName: '',
    price: '',
    rating: '',
    location: '',
    photo: null,
    description: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(homeId)

  useEffect(() => {
    if (!homeId) return

    api.get(`/host/edit-home/${homeId}`)
      .then((response) => {
        const home = response.data
        setFormData({
          houseName: home.houseName || '',
          price: home.price || '',
          rating: home.rating || '',
          location: home.location || '',
          photo: null,
          description: home.description || '',
        })
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Unable to load this home.')
      })
  }, [homeId])

  const handleChange = (event) => {
    const { name, value, files } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: files ? files[0] : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    const payload = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== '') payload.append(key, value)
    })
    if (homeId) payload.append('id', homeId)

    try {
      if (isEditing) {
        await api.put('/host/edit-home', payload)
      } else {
        await api.post('/host/add-home', payload)
      }
      window.location.assign('/host/host-home-list')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save this home.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="edit-home-page">
      <NavBar isLoggedIn user={user} currentPage={isEditing ? 'host-homes' : 'addHome'} />
      <main className="edit-home-main">
        <div className="edit-home-card">
          <div className="edit-home-header">
            <h1>🏠 {isEditing ? 'Edit Your Home' : 'Register Your Home'}</h1>
            <p>Share your property with travelers around the world</p>
          </div>

          {error && <div className="page-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="edit-home-form" encType="multipart/form-data">
            <div className="edit-home-field">
              <label htmlFor="houseName">🏡 House Name</label>
              <input id="houseName" type="text" name="houseName" value={formData.houseName} onChange={handleChange} placeholder="Enter property name" required />
            </div>

            <div className="edit-home-grid">
              <div className="edit-home-field">
                <label htmlFor="price">💰 Price Per Night</label>
                <input id="price" type="number" min="1" name="price" value={formData.price} onChange={handleChange} placeholder="2500" required />
              </div>
              <div className="edit-home-field">
                <label htmlFor="rating">⭐ Rating</label>
                <input id="rating" type="number" step="0.1" min="1" max="5" name="rating" value={formData.rating} onChange={handleChange} placeholder="4.8" required />
              </div>
            </div>

            <div className="edit-home-field">
              <label htmlFor="location">📍 Location</label>
              <input id="location" type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Delhi, India" required />
            </div>

            <div className="edit-home-field">
              <label htmlFor="photo">🖼️ Image</label>
              <input id="photo" type="file" name="photo" accept="image/jpg, image/jpeg, image/png" onChange={handleChange} required={!isEditing} />
            </div>

            <div className="edit-home-field">
              <label htmlFor="description">📝 Description</label>
              <textarea id="description" name="description" rows="6" value={formData.description} onChange={handleChange} placeholder="Describe your property, amenities and nearby attractions..." />
            </div>

            <div className="edit-home-actions">
              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : isEditing ? 'Save Changes' : '➕ Add Home'}
              </button>
              <button type="button" className="secondary-btn" onClick={() => window.location.assign('/host/host-home-list')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default EditHomePage
