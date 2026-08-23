import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import hi from '../locales/hi.json'
import sat from '../locales/sat.json'

export const LANGS = [
  { code: 'hi', label: 'हिन्दी', font: '' },
  { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ', font: 'font-olchiki' },
  { code: 'en', label: 'English', font: '' },
] as const

export const STORAGE_KEY = 'safear.lang'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    sat: { translation: sat },
  },
  lng: localStorage.getItem(STORAGE_KEY) ?? 'hi',
  // Santali is a partial translation by design (see sat.json). Anything it is
  // missing shows Hindi rather than English, which is far more useful to the
  // target worker, and English is the final backstop for admin-only strings.
  fallbackLng: { sat: ['hi', 'en'], default: ['en'] },
  interpolation: { escapeValue: false },
})

export function setLanguage(code: string): void {
  localStorage.setItem(STORAGE_KEY, code)
  void i18n.changeLanguage(code)
}

export default i18n
