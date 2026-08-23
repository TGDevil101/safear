/**
 * Audio narration for AR steps (PRD 10: "audio instructions for all AR steps"
 * — the accessibility requirement, since the primary persona reads little).
 *
 * Two-tier strategy, deliberately:
 *   1. A pre-recorded MP3 at /audio/<lang>/<file> if one exists.
 *   2. Otherwise the browser's speech synthesiser, reading the translated
 *      prompt string.
 *
 * Tier 2 is what de-risks the Day 3 "record Hindi audio" task: narration works
 * from day one with zero recordings, and each MP3 dropped into public/audio/hi/
 * silently upgrades a step. Nothing breaks if the recordings never happen.
 */

const TTS_LANG: Record<string, string> = {
  hi: 'hi-IN',
  en: 'en-IN',
  // No Santali speech-synthesis voice exists on Android. Devanagari-adjacent
  // Hindi is the least-bad spoken fallback; the on-screen text stays Ol Chiki.
  sat: 'hi-IN',
}

let currentAudio: HTMLAudioElement | null = null

/**
 * Mobile Chrome blocks audio until a user gesture. Call this from the
 * "tap to begin" gate so later step transitions can narrate unprompted.
 */
export function unlockAudio(): void {
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) void new AudioCtx().resume()
    // Priming speechSynthesis with an empty utterance inside the gesture
    // makes the first real utterance fire immediately rather than being dropped.
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
    }
  } catch {
    // Audio is a nice-to-have; never let it block the module.
  }
}

export function stopNarration(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

function speak(text: string, lang: string): void {
  if (!('speechSynthesis' in window) || !text) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = TTS_LANG[lang] ?? 'en-IN'
  u.rate = 0.92
  window.speechSynthesis.speak(u)
}

/**
 * Narrate a step. Resolves as soon as playback has started (or been skipped) —
 * callers must never await the full clip.
 */
export async function narrate(
  audioFile: string | undefined,
  lang: string,
  fallbackText: string,
): Promise<void> {
  stopNarration()

  if (audioFile) {
    try {
      const audio = new Audio(`/audio/${lang}/${audioFile}`)
      currentAudio = audio
      await audio.play()
      return
    } catch {
      // Missing recording or blocked autoplay — drop through to synthesis.
      currentAudio = null
    }
  }

  speak(fallbackText, lang)
}
