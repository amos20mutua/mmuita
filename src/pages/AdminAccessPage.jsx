import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'

export default function AdminAccessPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: user?.email || '', password: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    if (!form.username || form.username.toLowerCase() !== (user?.email || '').toLowerCase()) {
      setLoading(false)
      return setMsg('Use your signed-in admin email as username.')
    }
    const { data, error } = await api.verifyAdminCredentials(form.username, form.password)
    setLoading(false)
    if (error) return setMsg(error.message || 'Verification failed.')
    if (!data?.ok) return setMsg('Invalid admin username or password.')
    window.sessionStorage.setItem(`efk-admin-ok-${user?.id || 'guest'}`, '1')
    navigate('/admin', { replace: true })
  }

  return (
    <section className="mx-auto max-w-md card p-5">
      <h1 className="text-xl font-extrabold">Admin Verification</h1>
      <p className="mt-1 text-sm text-slate-300">Enter admin email and password.</p>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <input className="input" type="email" name="username" value={form.username} onChange={update} placeholder="Admin email" required />
        <input className="input" type="password" name="password" value={form.password} onChange={update} placeholder="Admin password" required />
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? 'Verifying...' : 'Continue'}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm text-amber-300">{msg}</p>}
    </section>
  )
}
