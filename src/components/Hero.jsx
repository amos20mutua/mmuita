import { Link } from 'react-router-dom'
import { PUBLIC_TRACKING_CODE } from '../utils/constants'

export default function Hero({ content }) {
  return (
    <section className="card overflow-hidden p-6 md:p-9">
      <div className="max-w-2xl space-y-4">
        <span className="badge">Electric Delivery | Nairobi</span>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{content?.hero_title || 'Move anything. Quietly. Fast.'}</h1>
        <p className="text-sm text-slate-300 md:text-base">{content?.hero_subtitle || 'Same-day electric delivery for people and businesses.'}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="btn-primary" to="/request">{content?.hero_cta_text || 'Request Delivery'}</Link>
          <Link className="btn-ghost" to={`/track/${PUBLIC_TRACKING_CODE}`}>Track Delivery</Link>
        </div>
      </div>
    </section>
  )
}
