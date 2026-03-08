export default function EmptyState({ title, subtitle, action }) {
  return (
    <div className="card p-6 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
