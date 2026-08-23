import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LangSwitcher from '../components/LangSwitcher'
import { signInWorker } from '../lib/data'

const DEPARTMENTS = ['mining', 'processing', 'steel', 'maintenance', 'contract'] as const

/**
 * /worker — PRD 6.4.
 *
 * Name + phone only. OTP is explicitly out of scope for the demo (PRD 11);
 * the phone number is what identifies a returning worker so their history and
 * certificates survive a reinstall.
 */
export default function WorkerLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError(t('login.errName'))
    if (!/^\d{10}$/.test(phone.trim())) return setError(t('login.errPhone'))

    setError('')
    setBusy(true)
    await signInWorker(name, phone, department)
    navigate('/modules')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink-900 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-500">{t('app.name')}</h1>
          <p className="text-xs text-ink-400">{t('app.tagline')}</p>
        </div>
        <LangSwitcher />
      </header>

      <form onSubmit={submit} className="mx-auto mt-10 w-full max-w-sm flex-1 space-y-5">
        <div>
          <h2 className="text-xl font-semibold">{t('login.title')}</h2>
          <p className="mt-1 text-sm text-ink-400">{t('login.subtitle')}</p>
        </div>

        <label className="block">
          <span className="text-sm text-ink-400">{t('login.name')}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('login.namePlaceholder')}
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-lg outline-none focus:border-brand-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-ink-400">{t('login.phone')}</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={t('login.phonePlaceholder')}
            inputMode="numeric"
            autoComplete="tel"
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-lg tracking-wide outline-none focus:border-brand-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-ink-400">{t('login.department')}</span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-lg outline-none focus:border-brand-500"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {t(`departments.${d}`)}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand-500 py-4 text-lg font-bold text-white disabled:opacity-60"
        >
          {busy ? t('common.loading') : t('login.start')}
        </button>
      </form>

      <footer className="pt-6 text-center">
        <a href="/admin" className="text-xs text-ink-400 underline">
          {t('admin.loginTitle')}
        </a>
      </footer>
    </div>
  )
}
