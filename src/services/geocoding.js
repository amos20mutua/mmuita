import { getMapboxToken } from '../utils/mapsKey'

const mapboxSearch = async (query) => {
  const token = getMapboxToken()
  if (!token) return []
  const q = encodeURIComponent(query)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?autocomplete=true&limit=6&country=KE&access_token=${token}`
  const res = await fetch(url)
  const json = await res.json()
  return (json.features || []).map((f) => ({
    id: f.id,
    text: f.place_name,
    place_name: f.place_name,
    lat: Number(f.center?.[1]),
    lng: Number(f.center?.[0]),
    source: 'mapbox'
  }))
}

const nominatimSearch = async (query) => {
  const q = encodeURIComponent(query)
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=ke&q=${q}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const json = await res.json()
  return (json || []).map((f, i) => ({
    id: `nom-${f.place_id || i}`,
    text: f.display_name,
    place_name: f.display_name,
    lat: Number(f.lat),
    lng: Number(f.lon),
    source: 'nominatim'
  }))
}

export const searchPlaces = async (query) => {
  if (!query || query.trim().length < 2) return []
  try {
    const mapbox = await mapboxSearch(query)
    if (mapbox.length) return mapbox
  } catch {}
  try {
    return await nominatimSearch(query)
  } catch {
    return []
  }
}

export const geocodeOne = async (query) => {
  const results = await searchPlaces(query)
  return results[0] || null
}
