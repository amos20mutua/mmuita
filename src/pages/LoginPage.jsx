import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseEnabled, supabase } from '../lib/supabase'

export default function LoginPage() {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [msg, setMsg] = useState('')
  const { signInDemo, isDemoMode } = useAuth()
  const navigate = useNavigate()

  const update = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')

    if (!isSupabaseEnabled) {
      signInDemo('customer')
      navigate('/dashboard')
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
          emailRedirectTo: window.location.origin
        }
      })
      setMsg(error ? error.message : 'Account created. Check your email.')
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) setMsg(error.message)
    else navigate('/dashboard')
  }

  const reset = async () => {
    if (!isSupabaseEnabled) return setMsg('Password reset activates after database connection.')
    if (!form.email) return setMsg('Enter your email first.')
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/login` })
    setMsg(error ? error.message : 'Reset link sent.')
  }

  return (
    <section className="mx-auto max-w-md card p-5">
      {isDemoMode && (
        <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-300/10 p-3 text-xs text-amber-200">
          Live preview mode is active while backend connection is pending.
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => { signInDemo('customer'); navigate('/dashboard') }}>Continue as Customer</button>
            <button className="btn-ghost" onClick={() => { signInDemo('admin'); navigate('/admin') }}>Continue as Admin</button>
            <button className="btn-ghost" onClick={() => { signInDemo('rider'); navigate('/dashboard') }}>Continue as Rider</button>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <button className={mode === 'signin' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode('signin')}>Sign In</button>
        <button className={mode === 'signup' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode('signup')} disabled={isDemoMode}>Create Account</button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && <input className="input" name="full_name" placeholder="Full name" onChange={update} value={form.full_name} required />}
        <input className="input" name="email" type="email" placeholder="Email" onChange={update} value={form.email} required />
        <input className="input" name="password" type="password" placeholder="Password" onChange={update} value={form.password} required />
        <button className="btn-primary w-full" type="submit">{isDemoMode ? 'Continue' : mode === 'signin' ? 'Continue' : 'Create account'}</button>
      </form>
      <button onClick={reset} className="mt-3 text-sm text-brand">Forgot password?</button>
      {msg && <p className="mt-2 text-sm text-slate-300">{msg}</p>}
      <p className="mt-4 text-xs text-slate-400">Rider and admin access is provisioned internally only.</p>
      <Link className="mt-3 block text-sm text-brand" to="/">Back Home</Link>
    </section>
  )
}
