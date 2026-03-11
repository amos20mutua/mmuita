import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DeliveryRequestForm from '../components/DeliveryRequestForm'
import FareEstimator from '../components/FareEstimator'
import LazyMapView from '../components/LazyMapView'
import Toast from '../components/common/Toast'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { estimateFare } from '../services/pricing'
import { estimateRoute } from '../services/routing'
import { paymentService } from '../services/payment'
import { notificationService } from '../services/notification'
import { geocodeOne } from '../services/geocoding'
import { hasValidMapboxToken } from '../utils/mapsKey'

const code = () => `EFK${Date.now().toString().slice(-6)}`

export default function RequestPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [zones, setZones] = useState([])
  const [estimate, setEstimate] = useState(null)
  const [previewPoints, setPreviewPoints] = useState({ pickup: null, dropoff: null })
  const [routes, setRoutes] = useState([])
  const [activeRouteId, setActiveRouteId] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    ;(async () => {
      const [{ data: s }, { data: vt }, { data: z }] = await Promise.all([api.services(), api.vehicleTypes(), api.zones()])
      setServices(s || [])
      setVehicleTypes(vt || [])
      setZones(z || [])
    })()
  }, [])

  const makeEstimate = async (form) => {
    const pickup = {
      lat: Number(form.pickup_latitude),
      lng: Number(form.pickup_longitude),
      placeId: form.pickup_place_id,
      text: form.pickup_address_text
    }
    const dropoff = {
      lat: Number(form.dropoff_latitude),
      lng: Number(form.dropoff_longitude),
      placeId: form.dropoff_place_id,
      text: form.dropoff_address_text
    }

    if (!pickup.lat && form.pickup_address_text) {
      const guess = await geocodeOne(form.pickup_address_text)
      if (guess) Object.assign(pickup, { lat: Number(guess.lat), lng: Number(guess.lng), placeId: guess.id })
    }

    if (!dropoff.lat && form.dropoff_address_text) {
      const guess = await geocodeOne(form.dropoff_address_text)
      if (guess) Object.assign(dropoff, { lat: Number(guess.lat), lng: Number(guess.lng), placeId: guess.id })
    }

    if (!pickup.lat || !dropoff.lat) {
      setToast('Enter valid pickup and dropoff locations.')
      return null
    }

    setPreviewPoints({ pickup, dropoff })

    const route = await estimateRoute({ pickup, dropoff, departureTime: form.desired_delivery_time })
    const service = services.find((s) => s.id === form.service_id) || services[0]
    const vehicle = vehicleTypes.find((v) => v.id === form.vehicle_type)
    const { data: pConfigs } = await api.pricingRules(service?.id, form.vehicle_type)
    const pricingConfig = pConfigs?.[0] || null
    const options = (route?.alternatives?.length ? route.alternatives : [route]).map((r, idx) => {
      const calc = estimateFare({
        distanceKm: Number(r.distanceKm || 0),
        pricingConfig,
        urgency: form.urgency,
        weightCategory: form.package_weight_category,
        pickup,
        dropoff,
        zones
      })
      return {
        ...r,
        id: r.id || `route-${idx + 1}`,
        calc,
        vehicleName: vehicle?.name || 'Vehicle',
        total: calc.total
      }
    })

    setRoutes(options)
    const selectedId = activeRouteId || options[0]?.id
    if (!activeRouteId && selectedId) setActiveRouteId(selectedId)
    const chosen = options.find((r) => r.id === selectedId) || options[0]

    setEstimate({
      ...chosen.calc,
      trafficEtaMinutes: chosen.durationInTrafficMinutes || chosen.calc.etaMinutes,
      vehicleName: chosen.vehicleName
    })

    return { calc: chosen.calc, pickup, dropoff, chosen, vehicle }
  }

  const submit = async (e, form) => {
    e.preventDefault()
    if (!user) return navigate('/login')
    const result = await makeEstimate(form)
    if (!result) return

    const payload = {
      tracking_code: code(),
      customer_id: user.id,
      service_id: form.service_id,
      vehicle_type_id: form.vehicle_type,
      status: 'pending',
      pickup_address_text: form.pickup_address_text,
      pickup_latitude: result.pickup.lat,
      pickup_longitude: result.pickup.lng,
      dropoff_address_text: form.dropoff_address_text,
      dropoff_latitude: result.dropoff.lat,
      dropoff_longitude: result.dropoff.lng,
      package_type: form.package_type,
      package_weight_category: form.package_weight_category,
      urgency: form.urgency,
      distance_km: Number(result.chosen.distanceKm || result.calc.distanceKm),
      estimated_duration_minutes: result.chosen.durationInTrafficMinutes || result.calc.etaMinutes,
      estimated_price: result.calc.total,
      final_price: result.calc.total,
      sender_name: form.sender_name,
      sender_phone: form.sender_phone,
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      notes: form.notes
    }

    const { data, error } = await api.createOrder(payload)
    if (error) return setToast(error.message)
    const payment = await paymentService.initializePaymentIntent({ orderId: data.id, amount: payload.final_price })
    if (payment?.payment_reference) await api.updateOrder(data.id, { payment_reference: payment.payment_reference })
    await api.addStatusHistory({ order_id: data.id, status: 'pending', note: 'Order created', changed_by: user.id })
    await notificationService.sendOrderCreated({ order: data })
    navigate(`/track/${data.tracking_code}`)
  }

  const placeReady = hasValidMapboxToken()

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="card p-4">
        <h1 className="text-xl font-extrabold">Request Delivery</h1>
        <p className="mb-4 text-sm text-slate-300">Choose places, delivery time, and vehicle type.</p>
        <DeliveryRequestForm services={services} vehicleTypes={vehicleTypes} onPreview={makeEstimate} onSubmit={submit} canSubmit={Boolean(user)} placesReady={placeReady} />
        {!user && <p className="mt-3 text-xs text-amber-300">You can plan your delivery now. Sign in to place the request.</p>}
      </section>
      <div className="space-y-4">
        <FareEstimator estimate={estimate} />
        {routes.length > 1 && (
          <div className="card space-y-2 p-3">
            <p className="text-sm font-bold">Route alternatives</p>
            {routes.slice(0, 3).map((r) => (
              <button
                key={r.id}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${activeRouteId === r.id ? 'border-brand bg-brand/10' : 'border-line bg-[#0a291f]'}`}
                onClick={() => {
                  setActiveRouteId(r.id)
                  setEstimate({
                    ...r.calc,
                    trafficEtaMinutes: r.durationInTrafficMinutes || r.calc.etaMinutes,
                    vehicleName: r.vehicleName
                  })
                }}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="truncate">{r.summary || 'Route option'}</span>
                  <span className="text-xs text-slate-300 sm:text-sm">{r.durationInTrafficMinutes} min | KES {r.total.toFixed(0)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        <LazyMapView
          pickup={previewPoints.pickup}
          dropoff={previewPoints.dropoff}
          routes={routes}
          activeRouteId={activeRouteId || routes[0]?.id}
        />
      </div>
      <Toast message={toast} />
    </div>
  )
}


