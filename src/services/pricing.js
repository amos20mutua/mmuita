import { roughDurationMinutes, zoneSurcharge } from '../utils/geo'

export const estimateFare = ({
  distanceKm,
  service,
  urgency,
  weightCategory,
  vehicle,
  pickup,
  dropoff,
  zones = [],
  rules = []
}) => {
  const weightKey = weightCategory === 'small' ? 'light' : weightCategory === 'large' ? 'heavy' : weightCategory
  const base = Number(service?.base_fare || 0)
  const distance = Number(distanceKm || 0) * Number(service?.per_km_rate || 0)

  const urgencyRule = service?.urgency_surcharge_rules?.[urgency] || 0
  const weightRule = service?.weight_surcharge_rules?.[weightKey] || 0
  const zone = zoneSurcharge(pickup, dropoff, zones)

  const custom = rules
    .filter((r) => r.active)
    .reduce((sum, rule) => {
      if (rule.rule_type === 'flat') return sum + Number(rule.rule_config_json?.amount || 0)
      if (rule.rule_type === 'percent') return sum + (base + distance) * Number(rule.rule_config_json?.percent || 0)
      return sum
    }, 0)

  const subtotal = base + distance
  const vehicleExtra = Number(vehicle?.extra || 0)
  const vehicleMultiplier = Number(vehicle?.multiplier || 1)
  const total = (subtotal + urgencyRule + weightRule + zone + custom + vehicleExtra) * vehicleMultiplier

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    etaMinutes: roughDurationMinutes(distanceKm) + Number(vehicle?.etaBiasMin || 0),
    breakdown: {
      base,
      distance,
      urgency: urgencyRule,
      weight: weightRule,
      zone,
      custom,
      vehicleExtra,
      vehicleMultiplier
    },
    total: Number(total.toFixed(2))
  }
}
