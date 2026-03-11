import { useEffect, useMemo, useState } from 'react'
import PlaceInput from './PlaceInput'

const packageTypes = ['Parcel', 'Food', 'Documents', 'Retail']
const sizeCategories = ['small', 'medium', 'large']
const urgencies = ['standard', 'priority', 'express']

export default function DeliveryRequestForm({ services, vehicleTypes, onPreview, onSubmit, canSubmit, placesReady }) {
  const [form, setForm] = useState({
    pickup_address_text: '',
    pickup_place_id: '',
    pickup_latitude: null,
    pickup_longitude: null,
    dropoff_address_text: '',
    dropoff_place_id: '',
    dropoff_latitude: null,
    dropoff_longitude: null,
    desired_delivery_time: '',
    service_id: services[0]?.id || '',
    vehicle_type: vehicleTypes[0]?.id || '',
    package_type: packageTypes[0],
    package_weight_category: 'small',
    urgency: 'standard',
    notes: '',
    sender_name: '',
    sender_phone: '',
    recipient_name: '',
    recipient_phone: ''
  })

  useEffect(() => {
    setForm((s) => ({
      ...s,
      service_id: s.service_id || services[0]?.id || '',
      vehicle_type: s.vehicle_type || vehicleTypes[0]?.id || ''
    }))
  }, [services, vehicleTypes])

  const update = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))

  const selectedVehicle = useMemo(() => vehicleTypes.find((v) => v.id === form.vehicle_type), [form.vehicle_type, vehicleTypes])

  return (
    <form className="space-y-3" onSubmit={(e) => onSubmit(e, form)}>
      <div className="grid gap-3 md:grid-cols-2">
        <PlaceInput
          label="Pickup"
          value={form.pickup_address_text}
          onTextChange={(v) => setForm((s) => ({ ...s, pickup_address_text: v }))}
          onPlaceSelect={(p) =>
            setForm((s) => ({
              ...s,
              pickup_address_text: p.text,
              pickup_place_id: p.placeId,
              pickup_latitude: p.lat,
              pickup_longitude: p.lng
            }))
          }
          disabled={false}
        />
        <PlaceInput
          label="Dropoff"
          value={form.dropoff_address_text}
          onTextChange={(v) => setForm((s) => ({ ...s, dropoff_address_text: v }))}
          onPlaceSelect={(p) =>
            setForm((s) => ({
              ...s,
              dropoff_address_text: p.text,
              dropoff_place_id: p.placeId,
              dropoff_latitude: p.lat,
              dropoff_longitude: p.lng
            }))
          }
          disabled={false}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <select className="input" name="service_id" value={form.service_id} onChange={update}>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select className="input" name="package_type" value={form.package_type} onChange={update}>{packageTypes.map((v) => <option key={v}>{v}</option>)}</select>
        <select className="input" name="package_weight_category" value={form.package_weight_category} onChange={update}>{sizeCategories.map((v) => <option key={v}>{v}</option>)}</select>
        <select className="input" name="urgency" value={form.urgency} onChange={update}>{urgencies.map((v) => <option key={v}>{v}</option>)}</select>
      </div>

      <input className="input" type="datetime-local" name="desired_delivery_time" value={form.desired_delivery_time} onChange={update} />

      <div className="grid gap-2 md:grid-cols-3">
        {vehicleTypes.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setForm((s) => ({ ...s, vehicle_type: v.id }))}
            className={`rounded-xl border p-3 text-left ${form.vehicle_type === v.id ? 'border-brand bg-brand/10' : 'border-line bg-[#0b271f]'}`}
          >
            <p className="text-sm font-bold">{v.name}</p>
            <p className="text-xs text-slate-300">{v.description}</p>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400">Selected: {selectedVehicle?.name || 'Choose vehicle'}</p>

      <div className="grid gap-3 md:grid-cols-2">
        <input className="input" name="sender_name" value={form.sender_name} onChange={update} placeholder="Sender name" required />
        <input className="input" name="sender_phone" value={form.sender_phone} onChange={update} placeholder="Sender phone" required />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="input" name="recipient_name" value={form.recipient_name} onChange={update} placeholder="Recipient name" required />
        <input className="input" name="recipient_phone" value={form.recipient_phone} onChange={update} placeholder="Recipient phone" required />
      </div>

      <textarea className="input min-h-24" name="notes" value={form.notes} onChange={update} placeholder="Notes (optional)" />

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={() => onPreview(form)}>Get Live Estimate</button>
        <button type="submit" className="btn-primary" disabled={!canSubmit}>{canSubmit ? 'Confirm Request' : 'Login To Submit'}</button>
      </div>
      {!placesReady && <p className="text-xs text-amber-300">Mapbox limited. Using backup place search/map mode.</p>}
    </form>
  )
}
