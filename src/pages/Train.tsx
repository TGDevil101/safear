import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ARModule from '../components/ARModule'
import type { ARMode } from '../components/ARScene'
import { getModule } from '../modules'
import { AR_MODE_KEY } from './ModuleSelect'
import { currentWorker } from '../lib/data'

/**
 * /train/:moduleId — PRD 6.4, worker flow steps 4-5.
 *
 * Owns the AR phase and the debrief that follows it. The AR scene mounts once
 * inside ARModule and is torn down when this route unmounts, which is also
 * what releases the camera.
 */
export default function Train() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [done, setDone] = useState(false)

  const config = getModule(moduleId)
  const worker = currentWorker()
  const mode = ((localStorage.getItem(AR_MODE_KEY) as ARMode) ?? 'marker') satisfies ARMode

  if (!worker) {
    navigate('/worker', { replace: true })
    return null
  }
  if (!config) {
    navigate('/modules', { replace: true })
    return null
  }

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col bg-ink-900 p-6">
        <div className="mx-auto w-full max-w-sm flex-1 pt-12">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: config.accent }}
          >
            ✓
          </div>
          <h1 className="mt-5 text-2xl font-bold">{t('debrief.title')}</h1>
          <p className="mt-1 text-sm text-ink-400">{t('debrief.subtitle')}</p>
          <p className="mt-5 rounded-xl border border-white/10 bg-ink-800 p-4 text-sm leading-relaxed">
            {t(config.debriefKey)}
          </p>
        </div>
        <button
          onClick={() => navigate(`/quiz/${config.id}`)}
          className="w-full rounded-xl py-4 text-lg font-bold text-white"
          style={{ background: config.accent }}
        >
          {t('debrief.startQuiz')}
        </button>
      </div>
    )
  }

  return (
    <ARModule
      config={config}
      mode={mode}
      onComplete={() => setDone(true)}
      onExit={() => navigate('/modules')}
    />
  )
}
