import { Home, MapPinned, PackageCheck, UserCircle2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const Item = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${isActive ? 'text-brand' : 'text-slate-300'}`
    }
  >
    <Icon size={17} />
    {label}
  </NavLink>
)

export default function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-[#08261d]/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md">
        <Item to="/" icon={Home} label="Home" />
        <Item to="/request" icon={MapPinned} label="Request" />
        <Item to="/dashboard" icon={PackageCheck} label="Orders" />
        <Item to="/login" icon={UserCircle2} label="Account" />
      </div>
    </div>
  )
}
