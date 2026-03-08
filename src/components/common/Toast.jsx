import { useEffect, useState } from 'react'

export default function Toast({ message }) {
  const [visible, setVisible] = useState(Boolean(message))

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const id = setTimeout(() => setVisible(false), 2600)
    return () => clearTimeout(id)
  }, [message])

  if (!message || !visible) return null
  return <div className="fixed right-4 top-20 z-50 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-emerald-950 shadow-soft">{message}</div>
}
