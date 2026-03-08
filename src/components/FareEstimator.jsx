export default function FareEstimator({ estimate }) {
  if (!estimate) return null
  const b = estimate.breakdown
  return (
    <aside className="card p-4 text-sm">
      <h3 className="font-bold">Estimate</h3>
      <div className="mt-3 space-y-2 text-slate-300">
        <Row k="Distance" v={`${estimate.distanceKm} km`} />
        <Row k="ETA" v={`${estimate.etaMinutes} min`} />
        {estimate.trafficEtaMinutes ? <Row k="Traffic ETA" v={`${estimate.trafficEtaMinutes} min`} /> : null}
        {estimate.vehicleName ? <Row k="Vehicle" v={estimate.vehicleName} /> : null}
        <Row k="Base" v={`KES ${b.base.toFixed(0)}`} />
        <Row k="Distance fare" v={`KES ${b.distance.toFixed(0)}`} />
        <Row k="Urgency" v={`KES ${b.urgency.toFixed(0)}`} />
        <Row k="Parcel size" v={`KES ${b.weight.toFixed(0)}`} />
        <Row k="Zone" v={`KES ${b.zone.toFixed(0)}`} />
        <Row k="Vehicle extra" v={`KES ${b.vehicleExtra.toFixed(0)}`} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-base font-extrabold">
        <span>Total</span>
        <span>KES {estimate.total.toFixed(0)}</span>
      </div>
    </aside>
  )
}

const Row = ({ k, v }) => (
  <div className="flex justify-between">
    <span>{k}</span>
    <span>{v}</span>
  </div>
)
