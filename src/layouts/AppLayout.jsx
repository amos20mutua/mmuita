import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import MobileNav from '../components/common/MobileNav'

export default function AppLayout() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') Notification.requestPermission().catch(() => {})
  }, [])

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
        <Outlet />
      </main>
      <MobileNav />
    </>
  )
}
