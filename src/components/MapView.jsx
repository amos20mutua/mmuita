import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { getMapboxToken } from '../utils/mapsKey'

const FALLBACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: 'OpenStreetMap'
    }
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
}

const dot = (color) => {
  const el = document.createElement('div')
  el.style.width = '14px'
  el.style.height = '14px'
  el.style.borderRadius = '999px'
  el.style.background = color
  el.style.border = '2px solid #ffffff'
  return el
}

const validPoint = (p) => p && Number.isFinite(Number(p.lng)) && Number.isFinite(Number(p.lat))

export default function MapView({ pickup, dropoff, rider, routes = [], activeRouteId }) {
  const token = getMapboxToken()
  const box = useRef(null)
  const mapRef = useRef(null)
  const markers = useRef({})
  const [mapError, setMapError] = useState('')
  const [useBackup, setUseBackup] = useState(!token)

  useEffect(() => {
    if (!box.current || mapRef.current) return

    if (token && !useBackup) mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: box.current,
      style: token && !useBackup ? 'mapbox://styles/mapbox/dark-v11' : FALLBACK_STYLE,
      center: [36.817223, -1.286389],
      zoom: 11,
      attributionControl: false
    })

    map.on('load', () => {
      setMapError('')
      map.resize()
    })

    map.on('error', (e) => {
      const message = e?.error?.message || 'Unable to load map right now.'
      if (!useBackup) {
        map.remove()
        mapRef.current = null
        markers.current = {}
        setUseBackup(true)
        setMapError('Mapbox unavailable, switched to backup map.')
      } else {
        setMapError(message)
      }
    })

    mapRef.current = map
    return () => {
      mapRef.current = null
      markers.current = {}
      try {
        map.remove()
      } catch {}
    }
  }, [token, useBackup])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const run = () => {
      const mark = (k, p, color) => {
        if (!validPoint(p)) return
        if (!markers.current[k]) markers.current[k] = new mapboxgl.Marker({ element: dot(color) }).addTo(map)
        markers.current[k].setLngLat([Number(p.lng), Number(p.lat)])
      }

      mark('pickup', pickup, '#22c55e')
      mark('dropoff', dropoff, '#fbbf24')
      mark('rider', rider, '#3b82f6')

      if (!map.getSource('route-main')) {
        map.addSource('route-main', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        map.addLayer({ id: 'route-main', type: 'line', source: 'route-main', paint: { 'line-color': '#22c55e', 'line-width': 5 } })
      }

      if (!map.getSource('route-alt')) {
        map.addSource('route-alt', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        map.addLayer({ id: 'route-alt', type: 'line', source: 'route-alt', paint: { 'line-color': '#86efac', 'line-width': 3, 'line-opacity': 0.5 } })
      }

      const main = routes.find((r) => r.id === activeRouteId) || routes[0]
      const alt = routes.filter((r) => r.id !== main?.id)
      const toFeature = (r) => ({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: (r.path || []).map((p) => [p.lng, p.lat]) },
        properties: { id: r.id }
      })

      const mainSource = map.getSource('route-main')
      if (mainSource) mainSource.setData({ type: 'FeatureCollection', features: main ? [toFeature(main)] : [] })

      const altSource = map.getSource('route-alt')
      if (altSource) altSource.setData({ type: 'FeatureCollection', features: alt.map(toFeature) })

      const pts = [pickup, dropoff, rider].filter(validPoint)
      if (pts.length >= 2) {
        const first = [Number(pts[0].lng), Number(pts[0].lat)]
        const bounds = pts.reduce(
          (b, p) => b.extend([Number(p.lng), Number(p.lat)]),
          new mapboxgl.LngLatBounds(first, first)
        )
        map.fitBounds(bounds, { padding: 40, duration: 700 })
      }
    }

    if (map.isStyleLoaded()) run()
    else map.once('load', run)
  }, [pickup, dropoff, rider, routes, activeRouteId, useBackup])

  return (
    <div className="space-y-2">
      {mapError && <div className="rounded-xl border border-line bg-[#0b271f] px-3 py-2 text-xs text-amber-300">{mapError}</div>}
      <div ref={box} className="h-72 overflow-hidden rounded-xl border border-line" />
    </div>
  )
}
