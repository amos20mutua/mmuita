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

  const stickers = [
    '100% Electric Dispatch',
    'Lower Daily Delivery Cost',
    'Cleaner Urban Air',
    'Fast Nairobi Coverage',
    'Low-Noise Urban Movement',
    'Reliable Same-Day Routing'
  ]

  return (
    <div className="space-y-5">
      <Hero content={homepage} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">{homepage?.services_section_title || 'Services'}</h2>
        <a href={`/track/${PUBLIC_TRACKING_CODE}`} className="text-sm text-brand">Track Delivery</a>
      </div>

      {loading ? <LoadingCard /> : <ServiceCards services={services} />}

      <section className="card sticker-marquee-wrap p-3">
        <div className="sticker-marquee-track">
          {[...stickers, ...stickers].map((text, i) => (
            <span key={`${text}-${i}`} className="badge sticker-chip">{text}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
