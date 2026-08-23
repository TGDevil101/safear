/**
 * Shape of an AR training module.
 *
 * Decision 3 (see README): the step engine is generic and data-driven. A module is
 * a config file, not code. Adding modules 3-5 for the SIH finals build means
 * writing another config in this folder — no changes to ARModule/ARScene.
 */

export type EntityKind =
  | 'box'
  | 'cylinder'
  | 'plane'
  | 'sphere'
  | 'cone'
  | 'torus'
  | 'text'

export interface AREntity {
  id: string
  kind: EntityKind
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  color?: string
  opacity?: number
  /**
   * Short label rendered inside the AR scene.
   *
   * IMPORTANT: A-Frame's default MSDF font has no Devanagari or Ol Chiki
   * glyphs, so in-scene text must stay ASCII. All translated copy lives in the
   * 2D HUD overlay instead, which is plain DOM and renders any script.
   */
  label?: string
  labelColor?: string
  width?: number
  height?: number
  depth?: number
  radius?: number
  /** Raw A-Frame animation attribute, e.g. 'property: scale; dir: alternate; loop: true'. */
  animation?: string
  animation2?: string
  /** Only tappable entities take part in raycasting. */
  tappable?: boolean
}

export interface StepConfig {
  id: string
  /** i18n key for the short step title shown in the HUD. */
  titleKey: string
  /** i18n key for the instruction; also the text narrated by the audio clip. */
  promptKey: string
  /** Filename inside /audio/<lang>/, e.g. 'fire-1.mp3'. */
  audio?: string
  entities: AREntity[]
  /** Entity ids that count as a correct tap. */
  correctIds: string[]
  /** Every id in correctIds must be tapped before the step completes. */
  requireAll?: boolean
  /** Taps must follow the order of correctIds (used for the headcount checklist). */
  ordered?: boolean
  /** i18n key explaining why a wrong tap was wrong. */
  wrongFeedbackKey: string
  /** i18n key confirming a correct tap. */
  successKey: string
}

export interface ModuleConfig {
  /** Slug used in routes and as modules.id in Supabase. */
  id: string
  nameKey: string
  descKey: string
  briefKey: string
  debriefKey: string
  /** Tailwind-ish accent hex used on the 2D screens. */
  accent: string
  steps: StepConfig[]
}
