import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseEnabled, supabase } from '../lib/supabase'
import { mockStore } from '../lib/mockStore'

const AuthContext = createContext(null)

const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const t = setTimeout(() => {
        clearTimeout(t)
        reject(new Error('timeout'))
      }, ms)
    })
  ])

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(() => {
    if (!isSupabaseEnabled) {
      const demo = mockStore.profiles.find((p) => p.role === 'customer')
      setUser({ id: demo.id, email: demo.email })
      setProfile(demo)
      setProfileReady(true)
      setLoading(false)
      return
    }

    let unsub = null
    let cancelled = false

    const fetchProfile = async (id) => {
      if (!id) return null
      try {
        const { data: p } = await withTimeout(supabase.from('profiles').select('*').eq('id', id).maybeSingle())
        return p || null
      } catch {
        return null
      }
    }

    const boot = async () => {
      setProfileReady(false)
      try {
        const { data } = await withTimeout(supabase.auth.getSession())
        const sessionUser = data?.session?.user || null
        if (cancelled) return
        setUser(sessionUser)
        let p = sessionUser ? await fetchProfile(sessionUser.id) : null
        if (sessionUser && !p) {
          // Self-heal missing profiles when auth user exists but trigger didn't provision row.
          await supabase.from('profiles').upsert({
            id: sessionUser.id,
            email: sessionUser.email || '',
            full_name: sessionUser.user_metadata?.full_name || '',
            phone: sessionUser.user_metadata?.phone || '',
            role: 'customer',
            is_active: true
          })
          p = await fetchProfile(sessionUser.id)
        }
        if (cancelled) return
        setProfile(p)
        setProfileReady(true)
      } catch {
        if (cancelled) return
        setUser(null)
        setProfile(null)
        setProfileReady(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    boot()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      const next = session?.user || null
      if (cancelled) return
      setProfileReady(false)
      setUser(next)
      let p = next ? await fetchProfile(next.id) : null
      if (next && !p) {
        await supabase.from('profiles').upsert({
          id: next.id,
          email: next.email || '',
          full_name: next.user_metadata?.full_name || '',
          phone: next.user_metadata?.phone || '',
          role: 'customer',
          is_active: true
        })
        p = await fetchProfile(next.id)
      }
      if (!cancelled) {
        setProfile(p)
        setProfileReady(true)
      }
    })

    unsub = authListener?.subscription?.unsubscribe

    return () => {
      cancelled = true
      if (unsub) unsub()
    }
  }, [])

  const refreshProfile = async () => {
    if (!isSupabaseEnabled || !user?.id) return null
    try {
      const { data: p } = await withTimeout(supabase.from('profiles').select('*').eq('id', user.id).maybeSingle())
      setProfile(p || null)
      setProfileReady(true)
      return p || null
    } catch {
      setProfile(null)
      setProfileReady(true)
      return null
    }
  }

  const signInDemo = (role) => {
    const p = mockStore.profiles.find((x) => x.role === role) || mockStore.profiles[0]
    setUser({ id: p.id, email: p.email })
    setProfile(p)
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      profileReady,
      isDemoMode: !isSupabaseEnabled,
      signInDemo,
      refreshProfile,
      signOut: () => {
        if (typeof window !== 'undefined') {
          Object.keys(window.sessionStorage)
            .filter((k) => k.startsWith('efk-admin-ok-'))
            .forEach((k) => window.sessionStorage.removeItem(k))
        }
        return isSupabaseEnabled ? supabase.auth.signOut() : signInDemo('customer')
      }
    }),
    [user, profile, loading, profileReady]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
