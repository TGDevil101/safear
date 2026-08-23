import { useTranslation } from 'react-i18next'
import { LANGS, setLanguage } from '../lib/i18n'

/**
 * Hindi / Santali / English switcher (PRD 5.5).
 *
 * Rendered as plain DOM buttons, so Devanagari and Ol Chiki both display —
 * unlike in-scene A-Frame text, whose MSDF font is ASCII-only.
 */
export default function LangSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()

  return (
    <div className={`inline-flex rounded-lg bg-white/10 p-1 ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          aria-pressed={i18n.language === l.code}
          className={`rounded-md px-3 py-1.5 text-sm transition ${l.font} ${
            i18n.language === l.code
              ? 'bg-white text-ink-900 font-semibold'
              : 'text-ink-400 hover:text-white'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
