import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingCard from '../components/common/LoadingCard'
import { api } from '../services/api'
import { defaultPublicPages } from '../utils/publicPages'

const tabs = {
  promotions: { cta: '/request', ctaText: 'Unlock Savings' },
  support: { cta: '/track/EFK240901', ctaText: 'Track with Code' },
  about: { cta: '/request', ctaText: 'Book Green Delivery' },
  payments: { cta: '/request', ctaText: 'Pay on Request' }
}

export default function UtilityPage({ type = 'support' }) {
  const [pages, setPages] = useState(defaultPublicPages)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.publicPages()
      if (data) setPages(data)
      setLoading(false)
    })()
  }, [])

  const p = useMemo(() => pages[type] || pages.support || defaultPublicPages.support, [pages, type])
  const routeMeta = tabs[type] || { cta: '/', ctaText: 'Back Home' }

  if (loading) return <LoadingCard text="Preparing page..." />

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="card p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-brand">Efikishe</p>
        <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">{p.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">{p.intro}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(p.points || []).map((line) => (
          <article key={line} className="card p-4">
            <p className="text-sm text-slate-100">{line}</p>
          </article>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-sm text-slate-200">{p.footer}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={routeMeta.cta} className="btn-primary">{routeMeta.ctaText}</Link>
          <Link to="/" className="btn-ghost">Back Home</Link>
        </div>
      </div>
    </section>
  )
}
