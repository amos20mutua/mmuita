import { useMemo } from 'react'
import { GoogleMap, Marker, Polyline, TrafficLayer, useJsApiLoader } from '@react-google-maps/api'
import { getGoogleMapsKey } from '../utils/mapsKey'

const containerStyle = { width: '100%', height: '18rem', borderRadius: '0.9rem' }
const libs = ['places']

export default function MapView({ pickup, dropoff, rider, routes = [], activeRouteId }) {
  const apiKey = getGoogleMapsKey()
  const { isLoaded } = useJsApiLoader({ id: 'efikishe-gmaps', googleMapsApiKey: apiKey || '', libraries: libs })

  const center = useMemo(() => {
    if (pickup?.lat) return { lat: pickup.lat, lng: pickup.lng }
    return { lat: -1.286389, lng: 36.817223 }
  }, [pickup])

  if (!apiKey) {
    return (
      <div className="h-72 rounded-xl border border-line bg-[#0b271f] p-4 text-sm text-slate-300">
        Map preview requires a valid Google Maps key in `VITE_GOOGLE_MAPS_API_KEY` (starts with `AIza`).
      </div>
    )
  }

  if (!isLoaded) return <div className="h-72 animate-pulse rounded-xl border border-line bg-[#0b271f]" />

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12} options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}>
      <TrafficLayer />
      {pickup?.lat ? <Marker position={{ lat: pickup.lat, lng: pickup.lng }} label="P" /> : null}
      {dropoff?.lat ? <Marker position={{ lat: dropoff.lat, lng: dropoff.lng }} label="D" /> : null}
      {rider?.lat ? <Marker position={{ lat: rider.lat, lng: rider.lng }} label="R" /> : null}

      {routes.map((r) => (
        <Polyline
          key={r.id}
          path={r.path}
          options={{
            strokeColor: r.id === activeRouteId ? '#22c55e' : '#7dd3a6',
            strokeOpacity: r.id === activeRouteId ? 0.95 : 0.5,
            strokeWeight: r.id === activeRouteId ? 6 : 4
          }}
        />
      ))}
    </GoogleMap>
  )
}
