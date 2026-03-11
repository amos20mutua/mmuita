import { haversineKm, roughDurationMinutes } from '../utils/geo'
import { getMapboxToken } from '../utils/mapsKey'

export async function estimateRoute({ pickup, dropoff, departureTime }) {
  if (!pickup?.lat || !dropoff?.lat) return null

  const token = getMapboxToken()
  if (!token) {
    const distanceKm = haversineKm(pickup, dropoff)
    return {
      distanceKm,
      durationMinutes: roughDurationMinutes(distanceKm),
      durationInTrafficMinutes: roughDurationMinutes(distanceKm),
      alternatives: []
    }
  }

  const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`
  const depart = departureTime ? `&depart_at=${encodeURIComponent(new Date(departureTime).toISOString())}` : ''
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?alternatives=true&geometries=geojson&overview=full&steps=false${depart}&access_token=${token}`

  try {
    const res = await fetch(url)
    const json = await res.json()
    const routes = json.routes || []

    const mapped = routes.map((r, i) => ({
      id: `route-${i + 1}`,
      summary: r.legs?.[0]?.summary || `Option ${i + 1}`,
      distanceKm: Number((Number(r.distance || 0) / 1000).toFixed(2)),
      durationMinutes: Math.round(Number(r.duration || 0) / 60),
      durationInTrafficMinutes: Math.round(Number(r.duration || 0) / 60),
      path: r.geometry?.coordinates?.map((p) => ({ lng: p[0], lat: p[1] })) || []
    }))

    const primary = mapped[0]
    return {
      distanceKm: primary?.distanceKm || 0,
      durationMinutes: primary?.durationMinutes || 0,
      durationInTrafficMinutes: primary?.durationInTrafficMinutes || 0,
      alternatives: mapped
    }
  } catch {
    const distanceKm = haversineKm(pickup, dropoff)
    return {
      distanceKm,
      durationMinutes: roughDurationMinutes(distanceKm),
      durationInTrafficMinutes: roughDurationMinutes(distanceKm),
      alternatives: []
    }
  }
}
