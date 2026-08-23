import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { getCertificate, type Certificate as Cert } from '../lib/data'
import { getModule } from '../modules'

/**
 * /certificate/:certId — PRD 5.3.
 *
 * The QR encodes an ABSOLUTE verify URL, not a relative path: it is scanned by
 * a different phone (a DGMS inspector's), which has no idea what origin this
 * page was served from.
 *
 * The card is deliberately light-on-dark inverted — a white card maximises
 * camera contrast, which is what makes the scan work across a demo room.
 */
export default function CertificatePage() {
  const { certId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [cert, setCert] = useState<Cert | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void getCertificate(certId ?? '').then((result) => {
      if (!alive) return
      setCert(result.status === 'found' ? result.cert : null)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [certId])

  const verifyUrl = `${window.location.origin}/verify?id=${certId ?? ''}`
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'en' ? 'en-IN' : 'hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink-900">
        <p className="text-sm text-ink-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (!cert) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-900 p-6">
        <p className="text-sm text-ink-400">{t('cert.notFound')}</p>
        <button onClick={() => navigate('/modules')} className="text-sm underline">
          {t('cert.backToModules')}
        </button>
      </div>
    )
  }

  const module = getModule(cert.module_id)

  return (
    <div className="min-h-dvh bg-ink-900 p-5">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-2xl bg-white text-ink-900 shadow-2xl">
          <div className="bg-brand-500 px-6 py-4 text-white">
            <p className="text-xs uppercase tracking-widest opacity-90">SafeAR</p>
            <h1 className="text-lg font-bold">{t('cert.title')}</h1>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-400">{t('cert.issuedTo')}</p>
              <p className="text-2xl font-bold">{cert.worker_name}</p>
              <p className="text-sm text-ink-700">{t(`departments.${cert.department}`)}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-ink-400">{t('cert.module')}</p>
              <p className="font-semibold">
                {module ? t(module.nameKey) : cert.module_id}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-y border-ink-900/10 py-3">
              <div>
                <p className="text-xs text-ink-400">{t('cert.score')}</p>
                <p className="text-lg font-bold text-green-700">{cert.score}%</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">{t('cert.issued')}</p>
                <p className="text-sm font-medium">{fmt(cert.issued_at)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">{t('cert.validUntil')}</p>
                <p className="text-sm font-medium">{fmt(cert.valid_until)}</p>
              </div>
            </div>

            {/* Large and high-contrast on purpose: this gets scanned from
                across a room, by someone else's phone, under stage lighting. */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <QRCodeSVG value={verifyUrl} size={200} level="M" includeMargin />
              <p className="text-xs text-ink-400">{t('cert.scanHint')}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-ink-400">{t('cert.certId')}</p>
              <p className="break-all font-mono text-[11px] text-ink-700">{cert.id}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => navigate('/modules')}
            className="flex-1 rounded-xl bg-white/10 py-3 text-sm"
          >
            {t('cert.backToModules')}
          </button>
          {'share' in navigator && (
            <button
              onClick={() =>
                void navigator
                  .share({ title: t('cert.title'), url: verifyUrl })
                  .catch(() => undefined)
              }
              className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-semibold"
            >
              {t('cert.share')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
