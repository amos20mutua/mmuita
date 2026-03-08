const toRad = (n) => (n * Math.PI) / 180

export const haversineKm = (a, b) => {
  if (!a || !b) return 0
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * R * Math.asin(Math.sqrt(x))
}

export const roughDurationMinutes = (km, avgKmh = 28) => Math.max(8, Math.round((km / avgKmh) * 60))

const inPolygon = (point, polygon) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]
    const intersect = yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export const zoneSurcharge = (pickup, dropoff, zones = []) => {
  const match = zones.find(
    (z) =>
      z.active &&
      Array.isArray(z.polygon_json?.coordinates?.[0]) &&
      (inPolygon(pickup, z.polygon_json.coordinates[0]) || inPolygon(dropoff, z.polygon_json.coordinates[0]))
  )
  return match?.surcharge || 0
}
