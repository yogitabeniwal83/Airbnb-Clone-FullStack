import { useCallback, useEffect, useState } from 'react'

import api from '../api/axios'
import { isGuestUser } from '../utils/userAccess'

const useFavourites = (user) => {
  const canUseFavourites = isGuestUser(user)
  const [favouriteIds, setFavouriteIds] = useState([])
  const [loading, setLoading] = useState(canUseFavourites)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canUseFavourites) {
      return undefined
    }

    let active = true

    api.get('/favourites')
      .then((response) => {
        if (active) {
          const favourites = response.data.favourites || []
          setFavouriteIds(favourites.map((home) => home._id))
          setError('')
        }
      })
      .catch((requestError) => {
        if (!active) {
          return
        }

        if (requestError.response?.status === 401) {
          const returnTo = `${window.location.pathname}${window.location.search}`
          window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`)
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
  }, [canUseFavourites])

  const setFavouriteState = useCallback((homeId, isFavourite) => {
    setFavouriteIds((current) => {
      if (isFavourite) {
        return current.includes(homeId) ? current : [...current, homeId]
      }

      return current.filter((id) => id !== homeId)
    })
  }, [])

  return { favouriteIds, loading, error, setFavouriteState }
}

export default useFavourites
