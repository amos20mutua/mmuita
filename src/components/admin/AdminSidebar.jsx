const tabs = [
  'overview',
  'orders',
  'riders',
  'live_map',
  'services',
  'zones',
  'pricing',
  'content',
  'theme',
  'customers',
  'analytics',
  'notifications',
  'profile'
]

export default function AdminSidebar({ active, setActive }) {
  return (
    <aside className="card h-fit p-3">
      <nav className="grid gap-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`rounded-lg px-3 py-2 text-left text-sm capitalize ${active === t ? 'bg-brand text-emerald-950' : 'hover:bg-[#123729]'}`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </nav>
    </aside>
  )
}
