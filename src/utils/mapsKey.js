export const getMapboxToken = () => {
  const token = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim()
  if (!token || token.includes('YOUR_')) return ''
  return token
}

export const hasValidMapboxToken = () => Boolean(getMapboxToken())
