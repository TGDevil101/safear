import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getModule } from '../modules'
import { localised, questionsFor, PASS_PERCENT, type Question } from '../lib/questions'
import { createCertificate, currentWorker, recordCompletion } from '../lib/data'

/**
 * /quiz/:moduleId — the assessment engine (PRD 5.2).
 *
 * 5 MCQs in randomised order, 4 options, 80% to pass. A fail shows exactly
 * which answers were wrong with explanations, then enforces the 60-second
 * review period before the single retry.
 */

const COOLDOWN_SECONDS = 60

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

type Phase = 'answering' | 'scoring' | 'result'

export default function QuizPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const config = getModule(moduleId)
  const worker = currentWorker()

  const [round, setRound] = useState(0) // bumping this reshuffles for the retry
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('answering')
  const [attempts, setAttempts] = useState(1)
  const [cooldown, setCooldown] = useState(0)
  const [certId, setCertId] = useState<string | null>(null)

  const questions = useMemo<Question[]>(
    () => shuffle(questionsFor(moduleId ?? '')),
    // `round` is the retry trigger; reshuffling is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moduleId, round],
  )

  const score = useMemo(
    () =>
      questions.length === 0
        ? 0
        : Math.round(
            (answers.filter((a, i) => a === questions[i]?.correctIndex).length / questions.length) *
              100,
          ),
    [answers, questions],
  )
  const passed = score >= PASS_PERCENT

  const finish = useCallback(
    async (finalAnswers: number[]) => {
      if (!worker || !config) return
      setPhase('scoring')

      const correct = finalAnswers.filter((a, i) => a === questions[i]?.correctIndex).length
      const finalScore = Math.round((correct / questions.length) * 100)
      const didPass = finalScore >= PASS_PERCENT

      await recordCompletion(worker.id, config.id, finalScore, didPass, attempts)

      if (didPass) {
        const cert = await createCertificate(worker, config.id, finalScore)
        setCertId(cert.id)
      }
      setPhase('result')
    },
    [worker, config, questions, attempts],
  )

  // 60-second review period before the retry unlocks (PRD 5.2).
  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  useEffect(() => {
    if (phase === 'result' && !passed && cooldown === 0 && attempts === 1) {
      setCooldown(COOLDOWN_SECONDS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (!worker) navigate('/worker', { replace: true })
    else if (!config) navigate('/modules', { replace: true })
  }, [worker, config, navigate])

  if (!worker || !config) return null

  const question = questions[index]

  const choose = (optionIndex: number) => {
    if (selected !== null) return
    setSelected(optionIndex)
    const next = [...answers, optionIndex]

    window.setTimeout(() => {
      setSelected(null)
      if (index + 1 < questions.length) {
        setAnswers(next)
        setIndex(index + 1)
      } else {
        setAnswers(next)
        void finish(next)
      }
    }, 320)
  }

  const retry = () => {
    setAttempts((a) => a + 1)
    setRound((r) => r + 1)
    setIndex(0)
    setAnswers([])
    setSelected(null)
    setPhase('answering')
  }

  // ------------------------------------------------------------- scoring
  if (phase === 'scoring') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink-900 p-6 text-center">
        <div>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-white/20 border-t-brand-500" />
          <p className="mt-4 text-sm text-ink-400">{t('quiz.generating')}</p>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------- result
  if (phase === 'result') {
    return (
      <div className="min-h-dvh bg-ink-900 p-6">
        <div className="mx-auto max-w-md">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: passed ? '#16a34a' : '#b91c1c' }}
          >
            <p className="text-4xl font-bold">{score}%</p>
            <p className="mt-1 text-lg font-semibold">
              {passed ? t('quiz.passTitle') : t('quiz.failTitle')}
            </p>
            {!passed && (
              <p className="mt-1 text-sm opacity-90">
                {t('quiz.passNeeded', { pass: PASS_PERCENT })}
              </p>
            )}
          </div>

          {passed ? (
            <button
              onClick={() => certId && navigate(`/certificate/${certId}`)}
              className="mt-6 w-full rounded-xl bg-brand-500 py-4 text-lg font-bold"
            >
              {t('quiz.viewCert')}
            </button>
          ) : (
            <>
              <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-ink-400">
                {t('quiz.reviewTitle')}
              </h2>
              <div className="mt-3 space-y-3">
                {questions.map((q, i) => {
                  const loc = localised(q, i18n.language)
                  const given = answers[i]
                  const ok = given === q.correctIndex
                  if (ok) return null
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-red-500/30 bg-ink-800 p-4 text-sm"
                    >
                      <p className="font-medium">{loc.text}</p>
                      <p className="mt-2 text-red-400">
                        {t('quiz.yourAnswer')}: {loc.options[given] ?? '—'}
                      </p>
                      <p className="text-green-400">
                        {t('quiz.correctAnswer')}: {loc.options[q.correctIndex]}
                      </p>
                      <p className="mt-2 text-ink-400">{loc.explain}</p>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={retry}
                disabled={cooldown > 0}
                className="mt-6 w-full rounded-xl bg-brand-500 py-4 text-lg font-bold disabled:opacity-50"
              >
                {cooldown > 0 ? t('quiz.cooldown', { seconds: cooldown }) : t('quiz.retry')}
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/modules')}
            className="mt-4 w-full text-center text-xs text-ink-400 underline"
          >
            {t('cert.backToModules')}
          </button>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------------- answering
  if (!question) return null
  const loc = localised(question, i18n.language)

  return (
    <div className="flex min-h-dvh flex-col bg-ink-900 p-6">
      <div className="mx-auto w-full max-w-md flex-1">
        <div className="flex items-center justify-between text-xs text-ink-400">
          <span>{t('quiz.title')}</span>
          <span>{t('quiz.question', { current: index + 1, total: questions.length })}</span>
        </div>
        <div className="mt-2 flex gap-1">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= index ? config.accent : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>

        <h1 className="mt-8 text-xl font-semibold leading-snug">{loc.text}</h1>

        <div className="mt-6 space-y-3">
          {loc.options.map((option, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`w-full rounded-xl border px-4 py-4 text-left text-base transition ${
                selected === i
                  ? 'border-brand-500 bg-brand-500/20'
                  : 'border-white/10 bg-ink-800 active:bg-white/10'
              }`}
            >
              <span className="mr-3 text-ink-400">{'ABCD'[i]}</span>
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
