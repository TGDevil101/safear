import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase is optional at runtime.
 *
 * With no env vars set the app still runs end to end on localStorage, which
 * means `npm run dev` works for a new contributor with zero setup and the demo
 * survives a dead venue network. See data.ts for the fallback behaviour and
 * README.md for the one caveat: /verify genuinely needs the remote database,
 * because the inspector scans from a different device.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hasSupabase = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

if (!hasSupabase && import.meta.env.DEV) {
  console.warn(
    '[SafeAR] No VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set — running in local-only mode. ' +
      'Certificates will not verify from another device. See README.md.',
  )
}
