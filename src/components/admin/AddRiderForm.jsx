import { useState } from 'react'

export default function AddRiderForm({ onCreate }) {
  const [payload, setPayload] = useState({ full_name: '', email: '', phone: '' })

  const submit = (e) => {
    e.preventDefault()
    onCreate(payload)
    setPayload({ full_name: '', email: '', phone: '' })
  }

  return (
    <form className="card grid gap-2 p-4 md:grid-cols-4" onSubmit={submit}>
      <input className="input" placeholder="Rider name" value={payload.full_name} onChange={(e) => setPayload((s) => ({ ...s, full_name: e.target.value }))} required />
      <input className="input" placeholder="Email" type="email" value={payload.email} onChange={(e) => setPayload((s) => ({ ...s, email: e.target.value }))} required />
      <input className="input" placeholder="Phone" value={payload.phone} onChange={(e) => setPayload((s) => ({ ...s, phone: e.target.value }))} required />
      <button className="btn-primary" type="submit">Add Rider</button>
    </form>
  )
}
