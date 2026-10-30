import { API_ORIGIN } from '../api/axios'

export const getHomePhotoUrl = (photo) => {
  if (!photo) {
    return ''
  }

  if (/^https?:\/\//i.test(photo)) {
    return photo
  }

  const normalizedPath = photo.replace(/\\/g, '/').replace(/^\/+/, '')
  return `${API_ORIGIN}/${normalizedPath}`
}
