import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import App from './App.tsx'

/**
 * Deliberately NOT wrapped in <StrictMode>.
 *
 * StrictMode double-invokes effects in development. For every other component
 * that is a useful check, but for the AR scene it means: acquire the camera,
 * tear it down, acquire it again. AR.js does not reliably survive that — the
 * video element ends up detached and the marker is never found, which looks
 * exactly like "AR is broken" when the code is in fact fine.
 *
 * The tradeoff is taken knowingly: the scene is mounted once and driven
 * imperatively (ARScene.tsx, Decision 1), so the effect-purity checks
 * StrictMode buys would not apply to it anyway.
 */
createRoot(document.getElementById('root')!).render(<App />)
