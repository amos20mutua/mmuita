import ServiceVisual from './ServiceVisual'

const hook = {
  parcel: 'Daily personal and office drops',
  food: 'Fast merchant and meal dispatch',
  scheduled: 'Predictable business routing',
  express: 'Priority delivery in minutes',
  bulk: 'Multi-stop batch operations'
}

const fallbackServices = [
  { id: 'svc-parcel', name: 'Parcel Delivery', slug: 'parcel', description: 'Secure electric parcel movement across Nairobi.' },
  { id: 'svc-food', name: 'Food and Merchant', slug: 'food', description: 'Fast, clean dispatch for restaurants and stores.' },
  { id: 'svc-express', name: 'Express Same-Day', slug: 'express', description: 'Priority lane for urgent city drops.' },
  { id: 'svc-scheduled', name: 'Scheduled Business', slug: 'scheduled', description: 'Reliable timed delivery for daily operations.' }
]

export default function ServiceCards({ services = [] }) {
  const curated = (services?.length ? services : fallbackServices).slice(0, 4)

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {curated.map((s) => {
        return (
          <article key={s.id} className="card group p-4 transition hover:border-brand/50 hover:bg-[#133b2e]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold">{s.name}</h3>
                <p className="mt-1 text-xs text-slate-200">{hook[s.slug] || s.description}</p>
              </div>
              <ServiceVisual slug={s.slug} />
            </div>
          </article>
        )
      })}
    </section>
  )
}
