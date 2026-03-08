import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseEnabled, supabase } from '../lib/supabase'
import { mockStore } from '../lib/mockStore'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseEnabled) {
      const demo = mockStore.profiles.find((p) => p.role === 'customer')
      setUser({ id: demo.id, email: demo.email })
      setProfile(demo)
      setLoading(false)
      return
    }

    const load = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data?.session?.user || null
      setUser(sessionUser)
      if (sessionUser) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()
        setProfile(p || null)
      }
      setLoading(false)
    }
    load()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      const next = session?.user || null
      setUser(next)
      if (next) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', next.id).maybeSingle()
        setProfile(p || null)
      } else setProfile(null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

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
      isDemoMode: !isSupabaseEnabled,
      signInDemo,
      signOut: () => (isSupabaseEnabled ? supabase.auth.signOut() : signInDemo('customer'))
    }),
    [user, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
