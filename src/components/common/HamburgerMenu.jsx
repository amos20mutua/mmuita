import { Link, NavLink, useLocation } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { useEffect } from 'react'
import { PUBLIC_TRACKING_CODE } from '../../utils/constants'

const primary = [
  { to: '/request', label: 'Request Delivery' },
  { to: '/dashboard', label: 'My Deliveries' },
  { to: `/track/${PUBLIC_TRACKING_CODE}`, label: 'Track Delivery' }
]

const secondary = [
  { to: '/promotions', label: 'Promotions' },
  { to: '/support', label: 'Support' },
  { to: '/about', label: 'About Efikishe' },
  { to: '/payments', label: 'Payments' }
]

export default function HamburgerMenu({ open, setOpen, user, signOut }) {
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname, setOpen])

  if (!open) return null

  return (
    <>
      <button aria-label="Close menu" className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <aside className="fixed right-0 top-0 z-[60] flex h-full w-full flex-col border-l border-line bg-[#04140f] p-4 shadow-soft sm:w-[92%] sm:max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold">Menu</p>
          <button aria-label="Close" className="rounded-lg border border-line p-2" onClick={() => setOpen(false)}><X size={16} /></button>
        </div>

        <div className="rounded-xl border border-[#1f4a3b] bg-[#0a1d17] p-3">
          <p className="text-xs text-slate-400">Average Rating</p>
          <p className="mt-1 text-2xl font-extrabold">4.9</p>
          <p className="text-xs text-slate-400">Based on rider and customer feedback</p>
        </div>

        <nav className="mt-4 space-y-1">
          {primary.map((item) => (
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
    </>
  )
}
