import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oesynmebzsswcxdmqovy.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = 
  Boolean(supabaseAnonKey) && 
  supabaseAnonKey !== 'tu_supabase_anon_key_aqui' && 
  supabaseAnonKey.length > 20

// Cliente oficial de Supabase con tipado estricto
export const supabase = createClient<Database>(
  supabaseUrl,
  isSupabaseConfigured ? supabaseAnonKey : 'dummy-key-for-local-development'
)
