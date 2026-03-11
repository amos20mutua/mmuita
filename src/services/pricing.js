import { roughDurationMinutes, zoneSurcharge } from '../utils/geo'

export const estimateFare = ({
  distanceKm,
  pricingConfig,
  urgency,
  weightCategory,
  pickup,
  dropoff,
  zones = []
}) => {
  const cfg = pricingConfig || {}
  const weightKey = weightCategory === 'small' ? 'small' : weightCategory === 'large' ? 'large' : weightCategory
  const base = Number(cfg.base_fare || 0)
  const distance = Number(distanceKm || 0) * Number(cfg.per_km_rate || 0)

  const urgencyRule = cfg.urgency_rules_json?.[urgency] || 0
  const weightRule = cfg.weight_rules_json?.[weightKey] || 0
  const zone = zoneSurcharge(pickup, dropoff, zones)
  const zoneRule = Number(cfg.zone_rules_json?.default || 0)
  const timeFee = Number(cfg.per_minute_rate || 0) * roughDurationMinutes(distanceKm)

  const subtotal = base + distance + timeFee
  const total = subtotal + urgencyRule + weightRule + zone + zoneRule

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    etaMinutes: roughDurationMinutes(distanceKm),
    breakdown: {
      base,
      distance,
      timeFee,
      urgency: urgencyRule,
      weight: weightRule,
      zone,
      custom: zoneRule,
      vehicleExtra: 0,
      vehicleMultiplier: 1
    },
    total: Number(total.toFixed(2))
  }
}
