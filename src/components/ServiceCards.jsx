import { Boxes, BriefcaseBusiness, Clock3, Package, ShoppingBag } from 'lucide-react'

const iconMap = {
  parcel: Package,
  food: ShoppingBag,
  business: BriefcaseBusiness,
  express: Clock3,
  bulk: Boxes
}

export default function ServiceCards({ services = [] }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {services.map((s) => {
        const Icon = iconMap[s.slug] || Package
        return (
          <article key={s.id} className="card p-4">
            <Icon className="text-brand" size={20} />
            <h3 className="mt-2 text-sm font-bold">{s.name}</h3>
            <p className="mt-1 text-xs text-slate-300">{s.description}</p>
          </article>
        )
      })}
    </section>
  )
}
