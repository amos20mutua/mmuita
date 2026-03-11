import { Link, NavLink, useLocation } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PUBLIC_TRACKING_CODE } from '../../utils/constants'
import { api } from '../../services/api'

const primary = [
  { to: '/request', label: 'Request Delivery' },
  { to: `/track/${PUBLIC_TRACKING_CODE}`, label: 'Track Delivery' }
]

const secondary = [
  { to: '/promotions', label: 'Promotions' },
  { to: '/support', label: 'Support' },
  { to: '/about', label: 'About Efikishe' },
  { to: '/payments', label: 'Payments' }
]

export default function HamburgerMenu({ open, setOpen, user, profile, signOut }) {
  const location = useLocation()
  const [avg, setAvg] = useState({ rider_avg: 4.9, app_avg: 4.9, total: 0 })
  const startX = useRef(0)

  useEffect(() => setOpen(false), [location.pathname, setOpen])

  useEffect(() => {
    if (!open || !api.ratingSummary) return
    api.ratingSummary().then(({ data }) => {
      if (!data) return
      const row = Array.isArray(data) ? data[0] : data
      setAvg({
        rider_avg: Number(row?.rider_avg || 0) || 4.9,
        app_avg: Number(row?.app_avg || 0) || 4.9,
        total: Number(row?.total_reviews || row?.total || 0)
      })
    })
  }, [open])

  const dashboardItem =
    profile?.role === 'rider' ? { to: '/rider', label: 'Rider Dashboard' } : { to: '/dashboard', label: 'My Deliveries' }

  const averageRating = useMemo(() => ((avg.rider_avg + avg.app_avg) / 2).toFixed(1), [avg])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 lg:hidden" onClick={() => setOpen(false)}>
      <aside
        className="ml-auto flex h-full w-[84vw] max-w-[360px] min-w-[280px] flex-col border-l border-line bg-[#071911] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX
        }}
        onTouchMove={(e) => {
          const delta = e.touches[0].clientX - startX.current
          if (delta > 48) setOpen(false)
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold">Menu</p>
          <button aria-label="Close" className="rounded-lg border border-line p-2" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="rounded-xl border border-[#1f4a3b] bg-[#0a1d17] p-3">
          <p className="text-xs text-slate-400">Average Rating</p>
          <p className="mt-1 text-2xl font-extrabold">{averageRating}</p>
          <p className="text-xs text-slate-400">{avg.total ? `${avg.total} completed reviews` : 'Based on rider and customer feedback'}</p>
        </div>

        <nav className="mt-4 space-y-1">
          {[dashboardItem, ...primary].map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-brand text-emerald-950' : 'hover:bg-[#102c22]'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="my-4 border-t border-line" />

        <nav className="space-y-1">
          {secondary.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-brand text-emerald-950' : 'hover:bg-[#102c22]'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-line pt-3">
          {user ? (
            <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-[#102c22] px-3 py-2.5 text-sm hover:bg-[#163c2e]">
              <LogOut size={16} />Logout
            </button>
          ) : (
            <Link to="/login" className="btn-primary w-full">Login</Link>
          )}
        </div>
      </aside>
    </div>
  )
}
