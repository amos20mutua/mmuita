export const getGoogleMapsKey = () => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  return /^AIza[\w-]{20,}$/.test(key) ? key : ''
}

export const hasValidGoogleMapsKey = () => Boolean(getGoogleMapsKey())
