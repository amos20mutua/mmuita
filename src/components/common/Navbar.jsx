import { Link, NavLink } from 'react-router-dom'
import { Menu, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import HamburgerMenu from './HamburgerMenu'
import { PUBLIC_TRACKING_CODE } from '../../utils/constants'

const navClass = ({ isActive }) => (isActive ? 'text-brand' : 'text-slate-300 hover:text-white')

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-app/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <img src="/logo-efikishe.svg" alt="Efikishe" className="h-8 w-8 rounded-lg bg-white/90 p-1" />
          <span>Efikishe</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          <NavLink to="/request" className={navClass}>Request</NavLink>
          <NavLink to={`/track/${PUBLIC_TRACKING_CODE}`} className={navClass}>Track</NavLink>
          {user && <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>}
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={navClass}><span className="inline-flex items-center gap-1"><ShieldCheck size={14} />Admin</span></NavLink>
          )}
        </nav>

        <button aria-label="Open menu" className="rounded-xl border border-line bg-panel/70 p-2 hover:bg-panel" onClick={() => setOpen(true)}>
          <Menu size={18} />
        </button>
      </div>

      <HamburgerMenu open={open} setOpen={setOpen} user={user} signOut={signOut} />
    </header>
  )
}
