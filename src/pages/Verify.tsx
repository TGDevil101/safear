import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCertificate, isValid, type Certificate } from '../lib/data'
import { getModule } from '../modules'

/**
 * /verify — public, no login (PRD 5.3, 6.4). What a DGMS inspector sees after
 * scanning a worker's QR code.
 *
 * Three outcomes, not two. "Cannot reach the register" is kept distinct from
 * "not found" on purpose: telling an inspector a legitimate worker's
 * certificate is INVALID because the venue wifi dropped would be a serious
 * failure of this screen's whole job.
 */

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'valid'; cert: Certificate }
  | { kind: 'expired'; cert: Certificate }
  | { kind: 'notFound' }
  | { kind: 'unreachable' }

export default function Verify() {
  const [params, setParams] = useSearchParams()
  const { t, i18n } = useTranslation()
  const [manualId, setManualId] = useState('')
  // Arriving with ?id= means we are already checking — derive that from the URL
  // rather than setting it from inside the effect.
  const [state, setState] = useState<State>(() =>
    params.get('id') ? { kind: 'checking' } : { kind: 'idle' },
  )

  const id = params.get('id')

  const check = useCallback(async (certId: string) => {
    const result = await getCertificate(certId.trim())
    if (result.status === 'notFound') return setState({ kind: 'notFound' })
    if (result.status === 'remoteUnavailable') return setState({ kind: 'unreachable' })
    setState(
      isValid(result.cert)
        ? { kind: 'valid', cert: result.cert }
        : { kind: 'expired', cert: result.cert },
    )
  }, [])

  // Fetching on ?id= change is the canonical use of an effect: synchronising
  // with an external system. The linter flags this because `check` contains
  // setState calls, but every one of them runs after an `await`, so none is
  // synchronous with the effect. The "checking" state is set by the event that
  // caused it, or derived from the URL at mount.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    if (id) void check(id)
  }, [id, check])

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'en' ? 'en-IN' : 'hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const banner = {
    valid: { bg: '#16a34a', icon: '✓', label: t('verify.valid') },
    expired: { bg: '#d97706', icon: '!', label: t('verify.expired') },
    notFound: { bg: '#b91c1c', icon: '✕', label: t('verify.invalid') },
    unreachable: { bg: '#475569', icon: '⚠', label: t('verify.unreachable') },
  } as const

  const cert = state.kind === 'valid' || state.kind === 'expired' ? state.cert : null
  const module = cert ? getModule(cert.module_id) : undefined

  return (
    <div className="min-h-dvh bg-ink-900 p-6">
      <div className="mx-auto max-w-md">
        <header className="text-center">
          <p className="text-sm font-bold text-brand-500">SafeAR</p>
          <h1 className="text-xl font-semibold">{t('verify.title')}</h1>
        </header>

        {state.kind === 'checking' && (
          <p className="mt-10 text-center text-sm text-ink-400">{t('verify.checking')}</p>
        )}

        {(state.kind === 'valid' ||
          state.kind === 'expired' ||
          state.kind === 'notFound') && (
          <div className="mt-6">
            <div
              className="flex items-center gap-3 rounded-2xl px-5 py-4"
              style={{ background: banner[state.kind].bg }}
            >
              <span className="text-3xl">{banner[state.kind].icon}</span>
              <span className="text-lg font-bold tracking-wide">{banner[state.kind].label}</span>
            </div>

            {state.kind === 'notFound' && (
              <p className="mt-4 text-sm text-ink-400">{t('verify.invalidHelp')}</p>
            )}
            {state.kind === 'expired' && (
              <p className="mt-4 text-sm text-amber-400">{t('verify.expiredHelp')}</p>
            )}

            {cert && (
              <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-ink-800 p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-400">
                    {t('cert.issuedTo')}
                  </p>
                  <p className="text-xl font-bold">{cert.worker_name}</p>
                  <p className="text-sm text-ink-400">{t(`departments.${cert.department}`)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-400">{t('cert.module')}</p>
                  <p className="font-medium">{module ? t(module.nameKey) : cert.module_id}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
                  <div>
                    <p className="text-xs text-ink-400">{t('cert.score')}</p>
                    <p className="font-bold text-green-400">{cert.score}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">{t('cert.issued')}</p>
                    <p className="text-sm">{fmt(cert.issued_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">{t('cert.validUntil')}</p>
                    <p className="text-sm">{fmt(cert.valid_until)}</p>
                  </div>
                </div>
                <p className="break-all font-mono text-[11px] text-ink-400">{cert.id}</p>
              </div>
            )}
          </div>
        )}

        {state.kind === 'unreachable' && (
          <div className="mt-6">
            <div
              className="flex items-center gap-3 rounded-2xl px-5 py-4"
              style={{ background: banner.unreachable.bg }}
            >
              <span className="text-3xl">{banner.unreachable.icon}</span>
              <span className="text-lg font-bold tracking-wide">{t('verify.unreachable')}</span>
            </div>
            <p className="mt-4 text-sm text-ink-400">{t('verify.unreachableHelp')}</p>
            <button
              onClick={() => {
                if (!id) return
                setState({ kind: 'checking' })
                void check(id)
              }}
              className="mt-4 w-full rounded-xl bg-white/10 py-3 text-sm"
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Manual lookup: an inspector may read the ID off a printed card, and
            the safety officer uses the same box from the dashboard. */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!manualId.trim()) return
            setState({ kind: 'checking' })
            setParams({ id: manualId.trim() })
          }}
          className="mt-8"
        >
          <label className="text-xs uppercase tracking-wide text-ink-400">
            {t('verify.enterId')}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-800 px-3 py-3 font-mono text-xs outline-none focus:border-brand-500"
            />
            <button type="submit" className="rounded-xl bg-brand-500 px-5 text-sm font-semibold">
              {t('verify.check')}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-xs text-ink-400">{t('verify.issuedBy')}</p>
      </div>
    </div>
  )
}
