import { useState } from 'react'

import api from '../../api/axios'
import { isHostUser } from '../../utils/userAccess'

const FavouriteButton = ({
  homeId,
  user,
  initialIsFavourite = false,
  onChange,
  variant = 'default',
  disabled = false,
  className = '',
}) => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  const handleClick = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!user) {
      const returnTo = `${window.location.pathname}${window.location.search}`
      window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }

    if (isPending || disabled) {
      return
    }

    setIsPending(true)
    setError('')

    try {
      if (initialIsFavourite) {
        await api.delete(`/favourites/${homeId}`)
      } else {
        await api.post(`/favourites/${homeId}`)
      }

      const nextValue = !initialIsFavourite
      onChange?.(homeId, nextValue)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        const returnTo = `${window.location.pathname}${window.location.search}`
        window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`)
        return
      }

      setError(requestError.response?.data?.message || 'Unable to update favourite.')
    } finally {
      setIsPending(false)
    }
  }

  const buttonLabel = initialIsFavourite ? 'Remove Favourite' : 'Add to Favourites'

  if (isHostUser(user)) {
    return null
  }

  return (
    <div className={`favourite-control ${variant}`}>
      <button
        type="button"
        className={className || `favourite-btn ${variant} ${initialIsFavourite ? 'active' : ''}`}
        onClick={handleClick}
        disabled={isPending || disabled}
        aria-pressed={initialIsFavourite}
        aria-label={buttonLabel}
        title={buttonLabel}
      >
        <span aria-hidden="true">{initialIsFavourite ? '♥' : '♡'}</span>
        {variant !== 'icon' && (
          <span>{isPending ? 'Updating…' : buttonLabel}</span>
        )}
      </button>
      {error && <span className="favourite-button-error" role="alert">{error}</span>}
    </div>
  )
}

export default FavouriteButton
