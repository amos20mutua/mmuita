import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

const isPlaceholder = (v) => !v || v.includes('YOUR_')

export const isSupabaseEnabled = Boolean(
  !isPlaceholder(supabaseUrl) &&
    !isPlaceholder(supabaseAnonKey) &&
    supabaseUrl.startsWith('https://')
)

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : null
