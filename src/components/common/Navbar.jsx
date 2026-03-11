import { Link, NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import HamburgerMenu from './HamburgerMenu'
import { PUBLIC_TRACKING_CODE } from '../../utils/constants'

const navClass = ({ isActive }) => (isActive ? 'text-brand' : 'text-slate-300 hover:text-white')

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const startX = useRef(null)
  const startY = useRef(null)
  const dashboardPath = profile?.role === 'rider' ? '/rider' : '/dashboard'

  useEffect(() => {
    const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches

    const onTouchStart = (e) => {
      if (!isMobile() || open) return
      const t = e.touches?.[0]
      if (!t) return
      if (window.innerWidth - t.clientX > 28) return
      startX.current = t.clientX
      startY.current = t.clientY
    }

    const onTouchMove = (e) => {
      if (!isMobile() || open || startX.current === null) return
      const t = e.touches?.[0]
      if (!t) return
      const dx = t.clientX - startX.current
      const dy = Math.abs(t.clientY - (startY.current || t.clientY))
      if (dx < -42 && dy < 36) {
        setOpen(true)
        startX.current = null
      }
    }

    const onTouchEnd = () => {
      startX.current = null
      startY.current = null
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-app/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <img src="/logo-efikishe.svg" alt="Efikishe" className="h-8 w-8 rounded-lg bg-white/90 p-1" />
          <span>Efikishe</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm lg:flex">
          <NavLink to="/request" className={navClass}>Request</NavLink>
          <NavLink to={`/track/${PUBLIC_TRACKING_CODE}`} className={navClass}>Track</NavLink>
          {user && <NavLink to={dashboardPath} className={navClass}>{profile?.role === 'rider' ? 'Rider' : 'Dashboard'}</NavLink>}
          <NavLink to="/support" className={navClass}>Support</NavLink>
          <NavLink to="/payments" className={navClass}>Payments</NavLink>
          <NavLink to="/about" className={navClass}>About</NavLink>
          {user ? <button onClick={signOut} className="btn-ghost">Logout</button> : <Link to="/login" className="btn-primary">Login</Link>}
        </nav>

        <button aria-label="Open menu" className="rounded-xl border border-line bg-panel/80 p-2 hover:bg-panel lg:hidden" onClick={() => setOpen(true)}>
          <Menu size={18} />
        </button>
      </div>

      <HamburgerMenu open={open} setOpen={setOpen} user={user} profile={profile} signOut={signOut} />
    </header>
  )
}
