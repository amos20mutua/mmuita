import { haversineKm, roughDurationMinutes } from '../utils/geo'

const toKm = (m) => Number((m / 1000).toFixed(2))

export async function estimateRoute({ pickup, dropoff, departureTime }) {
  if (!pickup?.lat || !dropoff?.lat) return null

  if (!window.google?.maps?.DirectionsService) {
    const distanceKm = haversineKm(pickup, dropoff)
    return {
      distanceKm,
      durationMinutes: roughDurationMinutes(distanceKm),
      durationInTrafficMinutes: roughDurationMinutes(distanceKm),
      alternatives: []
    }
  }

  const service = new window.google.maps.DirectionsService()
  const result = await service.route({
    origin: pickup.placeId ? { placeId: pickup.placeId } : { lat: pickup.lat, lng: pickup.lng },
    destination: dropoff.placeId ? { placeId: dropoff.placeId } : { lat: dropoff.lat, lng: dropoff.lng },
    travelMode: window.google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: true,
    drivingOptions: {
      departureTime: departureTime ? new Date(departureTime) : new Date(),
      trafficModel: window.google.maps.TrafficModel.BEST_GUESS
    }
  })

  const routes = result.routes || []
  const mapped = routes.map((r, i) => {
    const leg = r.legs?.[0]
    return {
      id: `route-${i + 1}`,
      summary: r.summary || `Option ${i + 1}`,
      distanceKm: toKm(leg?.distance?.value || 0),
      durationMinutes: Math.round((leg?.duration?.value || 0) / 60),
      durationInTrafficMinutes: Math.round((leg?.duration_in_traffic?.value || leg?.duration?.value || 0) / 60),
      path: r.overview_path?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || []
    }
  })

  const primary = mapped[0]
  return {
    distanceKm: primary?.distanceKm || 0,
    durationMinutes: primary?.durationMinutes || 0,
    durationInTrafficMinutes: primary?.durationInTrafficMinutes || 0,
    alternatives: mapped
  }
}
