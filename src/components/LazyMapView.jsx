import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const MapView = lazy(() => import('./MapView'))

export default function LazyMapView(props) {
  const holderRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = holderRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '250px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={holderRef}>
      {visible ? (
        <Suspense fallback={<div className="h-72 rounded-xl border border-line bg-[#0b271f] p-4 text-sm text-slate-300">Loading map...</div>}>
          <MapView {...props} />
        </Suspense>
      ) : (
        <div className="h-72 rounded-xl border border-line bg-[#0b271f] p-4 text-sm text-slate-300">Map is ready. Scroll here to load it.</div>
      )}
    </div>
  )
}

