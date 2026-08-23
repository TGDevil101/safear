import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminSignIn } from '../lib/data'
import { hasSupabase } from '../lib/supabase'

/**
 * /admin — PRD 5.4. Sign-in only; accounts are created by hand in the Supabase
 * dashboard. A public signup flow would be a compliance hole, not a feature.
 */
export default function AdminLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const ok = await adminSignIn(email, password)
    setBusy(false)
    if (ok) navigate('/admin/dashboard')
    else setError(t('admin.loginError'))
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-900 p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <div>
          <p className="text-sm font-bold text-brand-500">SafeAR</p>
          <h1 className="text-xl font-semibold">{t('admin.loginTitle')}</h1>
        </div>

        <label className="block">
          <span className="text-sm text-ink-400">{t('admin.email')}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none focus:border-brand-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-ink-400">{t('admin.password')}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none focus:border-brand-500"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand-500 py-3.5 font-semibold disabled:opacity-60"
        >
          {busy ? t('common.loading') : t('admin.signIn')}
        </button>

        {!hasSupabase && (
          <p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-400">
            No Supabase credentials configured — the dashboard opens with local demo data and any
            credentials are accepted. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enforce
            real authentication.
          </p>
        )}
      </form>
    </div>
  )
}
