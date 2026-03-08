import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import MobileNav from '../components/common/MobileNav'

export default function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-5 pb-24 md:pb-8">
        <Outlet />
      </main>
      <MobileNav />
    </>
  )
}
