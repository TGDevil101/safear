import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ARScene, { type ARMode, type ARSceneHandle } from './ARScene'
import { narrate, stopNarration, unlockAudio } from '../lib/narrate'
import type { ModuleConfig } from '../modules/types'

/**
 * Decision 3 (see README): the generic 5-step engine. Both modules — and every
 * module added later — are config, not code. Nothing here knows about fire or
 * gas.
 *
 * The AR scene is mounted once and driven imperatively; React state below owns
 * only the HUD.
 */

interface Props {
  config: ModuleConfig
  mode: ARMode
  onComplete: () => void
  onExit: () => void
}

type Feedback = { kind: 'ok' | 'wrong'; text: string } | null

export default function ARModule({ config, mode, onComplete, onExit }: Props) {
  const { t, i18n } = useTranslation()
  const sceneRef = useRef<ARSceneHandle>(null)

  const [started, setStarted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [tapped, setTapped] = useState<string[]>([])
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [markerFound, setMarkerFound] = useState(mode === 'demo')
  const [wrongCount, setWrongCount] = useState(0)
  const [arjsFailed, setArjsFailed] = useState(false)

  const step = config.steps[stepIndex]
  const isLast = stepIndex === config.steps.length - 1

  // Union of every entity across every step: the scene is built once, and
  // steps just toggle visibility. Rebuilding per step would remount the scene.
  const allEntities = useMemo(
    () => config.steps.flatMap((s) => s.entities),
    [config],
  )

  const promptText = t(step.promptKey)

  // Advancing a step = swap visible entities + narrate. No React remount.
  useEffect(() => {
    if (!started) return
    const scene = sceneRef.current
    if (!scene) return

    scene.resetColors()
    scene.showOnly(step.entities.map((e) => e.id))
    setTapped([])
    setFeedback(null)
    void narrate(step.audio, i18n.language, t(step.promptKey))
  }, [started, stepIndex, step, i18n.language, t])

  useEffect(() => stopNarration, [])

  const advance = useCallback(() => {
    if (isLast) {
      stopNarration()
      onComplete()
    } else {
      setStepIndex((i) => i + 1)
    }
  }, [isLast, onComplete])

  const handleTap = useCallback(
    (id: string) => {
      const scene = sceneRef.current
      if (!scene) return
      // Ignore taps on entities that belong to another step.
      if (!step.entities.some((e) => e.id === id)) return
      if (feedback?.kind === 'ok') return // already clearing this step

      const expected = step.ordered ? step.correctIds[tapped.length] : undefined
      const isCorrect = step.ordered
        ? id === expected
        : step.correctIds.includes(id) && !tapped.includes(id)

      if (!isCorrect) {
        scene.pulse(id, '#dc2626')
        setWrongCount((n) => n + 1)
        const text = t(step.wrongFeedbackKey)
        setFeedback({ kind: 'wrong', text })
        void narrate(undefined, i18n.language, text)
        window.setTimeout(() => setFeedback(null), 4200)
        return
      }

      scene.markDone(id)
      const nextTapped = [...tapped, id]
      setTapped(nextTapped)

      const needed = step.requireAll ? step.correctIds.length : 1
      if (nextTapped.length < needed) {
        scene.pulse(id, '#16a34a')
        return
      }

      const text = t(step.successKey)
      setFeedback({ kind: 'ok', text })
      void narrate(undefined, i18n.language, text)
      window.setTimeout(advance, 1600)
    },
    [step, tapped, feedback, t, i18n.language, advance],
  )

  const begin = () => {
    unlockAudio()
    setStarted(true)
  }

  // Gate screen: mobile Chrome will not play audio before a user gesture, and
  // mounting the scene here also means the camera prompt appears on a tap
  // rather than on page load, which users are far more likely to accept.
  if (!started) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink-900 p-8 text-center">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full text-4xl"
          style={{ background: config.accent }}
        >
          ▶
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t(config.nameKey)}</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-400">{t(config.briefKey)}</p>
        </div>
        <button
          onClick={begin}
          className="w-full max-w-xs rounded-xl px-6 py-4 text-lg font-bold text-white shadow-lg"
          style={{ background: config.accent }}
        >
          {t('ar.begin')}
        </button>
        <button onClick={onExit} className="text-sm text-ink-400 underline">
          {t('common.back')}
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black">
      <ARScene
        ref={sceneRef}
        entities={allEntities}
        mode={mode}
        onTap={handleTap}
        onMarkerChange={setMarkerFound}
        onLoadError={() => setArjsFailed(true)}
      />

      {/* ---- 2D HUD. Plain DOM, so Devanagari and Ol Chiki render fine. ---- */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4">
        <div className="pointer-events-auto flex items-start gap-3">
          <button
            onClick={onExit}
            className="rounded-lg bg-black/60 px-3 py-2 text-sm backdrop-blur"
          >
            ✕
          </button>
          <div className="flex-1 rounded-lg bg-black/60 px-3 py-2 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span>{t(config.nameKey)}</span>
              <span>
                {stepIndex + 1} / {config.steps.length}
              </span>
            </div>
            <div className="mt-1.5 flex gap-1">
              {config.steps.map((s, i) => (
                <div
                  key={s.id}
                  className="h-1 flex-1 rounded-full"
                  style={{
                    background: i <= stepIndex ? config.accent : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {mode === 'marker' && arjsFailed && (
          <div className="pointer-events-auto mx-auto max-w-xs rounded-xl bg-red-900/90 px-5 py-4 text-center backdrop-blur">
            <p className="text-sm font-semibold">{t('ar.arjsFailed')}</p>
            <button
              onClick={onExit}
              className="mt-3 w-full rounded-lg bg-white/15 py-2 text-xs"
            >
              {t('ar.switchToDemo')}
            </button>
          </div>
        )}

        {mode === 'marker' && !arjsFailed && !markerFound && (
          <div className="mx-auto rounded-xl bg-black/75 px-5 py-4 text-center backdrop-blur">
            <p className="text-sm font-medium">{t('ar.pointAtMarker')}</p>
            <p className="mt-1 text-xs text-ink-400">{t('ar.markerHint')}</p>
          </div>
        )}

        <div className="pointer-events-auto space-y-3">
          {feedback && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium shadow-lg"
              style={{
                background: feedback.kind === 'ok' ? '#16a34a' : '#b91c1c',
              }}
            >
              {feedback.kind === 'ok' ? '✓ ' : '✕ '}
              {feedback.text}
            </div>
          )}

          <div className="rounded-xl bg-black/75 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {t(step.titleKey)}
                </p>
                <p className="mt-1 text-base leading-snug">{promptText}</p>
              </div>
              <button
                onClick={() => void narrate(step.audio, i18n.language, promptText)}
                aria-label={t('ar.replayAudio')}
                className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-lg"
              >
                🔊
              </button>
            </div>

            {step.requireAll && (
              <div className="mt-3 flex gap-1.5">
                {step.correctIds.map((id, i) => (
                  <div
                    key={id}
                    className="h-1.5 flex-1 rounded-full"
                    style={{
                      background: i < tapped.length ? '#16a34a' : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
            )}

            {/* After repeated failures, stop letting the worker flounder. */}
            {wrongCount >= 3 && (
              <button
                onClick={advance}
                className="mt-3 w-full rounded-lg bg-white/10 py-2 text-xs text-ink-400"
              >
                {t('ar.skipStep')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
