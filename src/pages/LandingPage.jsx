import { useEffect, useState } from 'react'
import Hero from '../components/Hero'
import ServiceCards from '../components/ServiceCards'
import LoadingCard from '../components/common/LoadingCard'
import { api } from '../services/api'
import { PUBLIC_TRACKING_CODE } from '../utils/constants'

export default function LandingPage() {
  const [services, setServices] = useState([])
  const [homepage, setHomepage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [{ data: svcs }, { data: home }] = await Promise.all([api.services(), api.homepage()])
      setServices(svcs || [])
      setHomepage(home || null)
      setLoading(false)
    })()
  }, [])

  return (
    <div className="space-y-5">
      <Hero content={homepage} />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{homepage?.services_section_title || 'Services'}</h2>
        <a href={`/track/${PUBLIC_TRACKING_CODE}`} className="text-sm text-brand">Track Delivery</a>
      </div>
      {loading ? <LoadingCard /> : <ServiceCards services={services} />}
      <section className="card flex items-center justify-between p-4 text-sm">
        <p className="text-slate-300">Avg pickup 12 min | Nairobi coverage | 100% electric fleet</p>
      </section>
    </div>
  )
}
