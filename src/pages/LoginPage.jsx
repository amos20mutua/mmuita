import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseEnabled, supabase } from '../lib/supabase'

const routeByRole = (profile) => {
  if (profile?.role === 'admin') return '/admin'
  if (profile?.role === 'rider') return '/rider'
  return '/dashboard'
}

export default function LoginPage() {
  const [mode, setMode] = useState('signin')
  const [accountType, setAccountType] = useState('customer')
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '' })
  const [msg, setMsg] = useState('')
  const { signInDemo, isDemoMode, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const normalizedEmail = form.email.trim().toLowerCase()

  const update = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))
  const humanizeAuthError = (error) => {
    const text = String(error?.message || '').toLowerCase()
    if (text.includes('invalid login credentials')) return 'Email or password is incorrect. If you are new, create account first.'
    if (text.includes('email not confirmed')) return 'Your email is not confirmed yet. Click "Resend verification email".'
    if (text.includes('email rate limit') || text.includes('rate limit')) return 'Too many email requests. Wait a bit, then try again.'
    return error?.message || 'Authentication failed. Please try again.'
  }

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')

    if (!isSupabaseEnabled) {
      signInDemo('customer')
      navigate('/dashboard')
      return
    }

    if (mode === 'signup') {
      const role = accountType === 'rider' ? 'rider' : 'customer'
      const isActive = role === 'customer'

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone }, emailRedirectTo: window.location.origin }
      })
      if (error) return setMsg(humanizeAuthError(error))

      if (data?.user?.id) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: normalizedEmail,
          full_name: form.full_name,
          phone: form.phone,
          role,
          is_active: isActive
        })
      }

      if (role === 'rider') {
        setMsg('Rider account created. Waiting for admin approval before dashboard access.')
      } else {
        setMsg('Account created. Check your email to confirm, then sign in.')
      }
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: form.password })
    if (error) return setMsg(humanizeAuthError(error))

    const { data: current } = await supabase.auth.getUser()
    const signedUser = current?.user
    const p = signedUser?.id
      ? (await supabase.from('profiles').select('*').eq('id', signedUser.id).maybeSingle()).data
      : await refreshProfile()
    if (p?.role === 'rider' && !p?.is_active) {
      await supabase.auth.signOut()
      return setMsg('Rider account pending admin approval.')
    }
    navigate(routeByRole(p))
  }

  const reset = async () => {
    if (!isSupabaseEnabled) return setMsg('Password reset activates after database connection.')
    if (!normalizedEmail) return setMsg('Enter your email first.')
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${window.location.origin}/login` })
    setMsg(error ? humanizeAuthError(error) : 'Reset link sent.')
  }

  const resendVerification = async () => {
    if (!isSupabaseEnabled) return setMsg('Verification works after database connection.')
    if (!normalizedEmail) return setMsg('Enter your email first.')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: { emailRedirectTo: `${window.location.origin}/login` }
    })
    setMsg(error ? humanizeAuthError(error) : 'Verification email sent. Check inbox/spam.')
  }

  return (
    <section className="mx-auto max-w-md card p-5">
      {isDemoMode && (
        <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-300/10 p-3 text-xs text-amber-200">
          Connection setup is still in progress. You can continue with a local account view.
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => { signInDemo('customer'); navigate('/dashboard') }}>Open Local Customer View</button>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <button className={mode === 'signin' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode('signin')}>Sign In</button>
        <button className={mode === 'signup' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode('signup')} disabled={isDemoMode}>Create Account</button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <>
            <input className="input" name="full_name" placeholder="Full name" onChange={update} value={form.full_name} required />
            <input className="input" name="phone" placeholder="Phone number" onChange={update} value={form.phone} required />
          </>
        )}
        <input className="input" name="email" type="email" placeholder="Email" onChange={update} value={form.email} required />
        <input className="input" name="password" type="password" placeholder="Password" onChange={update} value={form.password} required />
        <button className="btn-primary w-full" type="submit">{mode === 'signin' ? 'Continue' : 'Create account'}</button>
      </form>

      {mode === 'signup' && !isDemoMode && (
        <button
          className="mt-2 text-left text-[11px] font-normal text-slate-400 hover:text-slate-300"
          onClick={() => setAccountType((s) => (s === 'customer' ? 'rider' : 'customer'))}
          type="button"
        >
          {accountType === 'customer' ? 'Rider? Create rider account (requires admin approval).' : 'Back to customer account signup'}
        </button>
      )}

      <button onClick={reset} className="mt-3 text-sm text-brand">Forgot password?</button>
      {!isDemoMode && <button onClick={resendVerification} className="mt-1 block text-left text-sm text-slate-300 hover:text-white">Resend verification email</button>}
      {msg && <p className="mt-2 text-sm text-slate-300">{msg}</p>}
      <p className="mt-4 text-xs text-slate-400">Secure admin access is managed by Efikishe operations.</p>
      <Link className="mt-3 block text-sm text-brand" to="/">Back Home</Link>
    </section>
  )
}

