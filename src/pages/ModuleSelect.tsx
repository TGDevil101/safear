import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LangSwitcher from '../components/LangSwitcher'
import { MODULES } from '../modules'
import { certificateFor, currentWorker, passedModules, signOutWorker } from '../lib/data'

export const AR_MODE_KEY = 'safear.arMode'

/**
 * /modules — PRD 6.4 and flow step 2: module 2 stays locked until module 1
 * is passed.
 *
 * The AR-mode toggle is the on-stage insurance: if the venue lighting or the
 * camera permission defeats marker tracking, "no marker" runs the identical
 * scene without it. See the demo-day checklist in the README.
 */
export default function ModuleSelect() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const worker = currentWorker()
  const arMode: 'marker' | 'demo' =
    (localStorage.getItem(AR_MODE_KEY) as 'marker' | 'demo' | null) ?? 'marker'

  useEffect(() => {
    if (!worker) navigate('/worker', { replace: true })
  }, [worker, navigate])

  const changeArMode = (next: 'marker' | 'demo') => {
    if (next === arMode) return
    localStorage.setItem(AR_MODE_KEY, next)
    // Full reload rather than a state update. AR.js cannot be unloaded once
    // its script is on the page, and its webcam system would then initialise
    // on the marker-less scene too. Reloading guarantees demo mode starts on a
    // page where AR.js was never fetched — and gives the camera a clean slate
    // in the other direction. This toggle is the on-stage emergency switch;
    // it must not half-work.
    window.location.reload()
  }

  if (!worker) return null

  const passed = passedModules(worker.id)

  return (
    <div className="min-h-dvh bg-ink-900 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">{t('moduleList.greeting', { name: worker.name })}</p>
          <h1 className="text-2xl font-bold">{t('moduleList.title')}</h1>
        </div>
        <LangSwitcher />
      </header>

      <div className="mx-auto mt-6 max-w-lg space-y-4">
        {/* AR mode toggle */}
        <div className="rounded-xl border border-white/10 bg-ink-800 p-4">
          <p className="text-sm font-semibold">{t('moduleList.arMode')}</p>
          <div className="mt-2 flex gap-2">
            {(['marker', 'demo'] as const).map((m) => (
              <button
                key={m}
                onClick={() => changeArMode(m)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                  arMode === m ? 'bg-brand-500 font-semibold text-white' : 'bg-white/10 text-ink-400'
                }`}
              >
                {t(m === 'marker' ? 'moduleList.markerMode' : 'moduleList.demoMode')}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-400">
            {t(arMode === 'marker' ? 'moduleList.markerModeHint' : 'moduleList.demoModeHint')}
          </p>
          {arMode === 'marker' && (
            <a
              href="/markers/hiro-marker.html"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-brand-500 underline"
            >
              {t('moduleList.getMarker')}
            </a>
          )}
        </div>

        {MODULES.map((m, i) => {
          const isPassed = passed.includes(m.id)
          const locked = i > 0 && !passed.includes(MODULES[i - 1].id)
          const cert = certificateFor(worker.id, m.id)

          return (
            <div
              key={m.id}
              className={`rounded-xl border p-5 transition ${
                locked ? 'border-white/5 bg-ink-800/50 opacity-60' : 'border-white/10 bg-ink-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-10 w-10 shrink-0 rounded-lg"
                  style={{ background: locked ? '#334155' : m.accent }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{t(m.nameKey)}</h2>
                    {isPassed && (
                      <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">
                        ✓ {t('moduleList.passed')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-400">{t(m.descKey)}</p>

                  {locked ? (
                    <p className="mt-3 text-xs text-ink-400">🔒 {t('moduleList.locked')}</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to={`/train/${m.id}`}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                        style={{ background: m.accent }}
                      >
                        {isPassed ? t('moduleList.review') : t('moduleList.start')}
                      </Link>
                      {cert && (
                        <Link
                          to={`/certificate/${cert.id}`}
                          className="rounded-lg bg-white/10 px-4 py-2 text-sm"
                        >
                          {t('moduleList.viewCert')}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <button
          onClick={() => {
            signOutWorker()
            navigate('/worker')
          }}
          className="mt-4 w-full text-center text-xs text-ink-400 underline"
        >
          {t('admin.signOut')}
        </button>
      </div>
    </div>
  )
}
