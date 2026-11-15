import { createClient } from '@supabase/supabase-js'

// A conexão com o banco. Enquanto não existir .env.local com as chaves
// (etapa do Supabase), fica nula e o app roda só com os dados de exemplo.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key ? createClient(url, key) : null
