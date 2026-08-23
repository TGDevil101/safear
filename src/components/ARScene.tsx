import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import type { AREntity } from '../modules/types'

/**
 * Decision 1 (see README): A-Frame lives OUTSIDE the React render cycle.
 *
 * A React re-render that touches <a-scene> remounts it and kills the camera
 * stream mid-demo — the single most likely way this build fails on stage. So
 * the scene is built imperatively via innerHTML exactly once (empty-deps
 * effect) and every subsequent change goes through the imperative handle
 * below. React state in the parent drives only the 2D HUD drawn on top.
 *
 * The tap callback is read through a ref so the parent can pass a fresh
 * closure on every render without ever remounting the scene.
 */

export type ARMode = 'marker' | 'demo'

export interface ARSceneHandle {
  /** Show exactly these entity wrappers, hide everything else. */
  showOnly(ids: string[]): void
  /** Briefly flash an entity a colour, then restore it. */
  pulse(id: string, color: string): void
  /** Permanently recolour an entity to show it has been completed. */
  markDone(id: string): void
  /** Restore every entity to its configured colour. */
  resetColors(): void
}

interface Props {
  entities: AREntity[]
  mode: ARMode
  onTap: (id: string) => void
  onReady?: () => void
  /** Marker mode only: fires when AR.js acquires or loses the Hiro marker. */
  onMarkerChange?: (found: boolean) => void
  /** Marker mode only: AR.js could not be fetched (offline / CDN blocked). */
  onLoadError?: () => void
  ref?: Ref<ARSceneHandle>
}

const DONE_COLOR = '#16a34a'

const ARJS_SRC = 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.7/aframe/build/aframe-ar.js'

let arjsPromise: Promise<void> | null = null

/**
 * Load AR.js on demand, once per page.
 *
 * It cannot live in index.html: A-Frame initialises a component's *system* on
 * every scene from schema defaults, whether or not the attribute is present.
 * AR.js's `arjs` system defaults to sourceType "webcam", so simply having the
 * script on the page made the marker-less demo mode grab the camera and paint
 * a "Webcam Error" banner over the scene. Loading it only for marker mode
 * means a demo-mode session never touches the camera at all.
 */
function loadArJs(): Promise<void> {
  if (arjsPromise) return arjsPromise
  arjsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = ARJS_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      arjsPromise = null // allow a retry on the next attempt
      reject(new Error('Failed to load AR.js'))
    }
    document.head.appendChild(script)
  })
  return arjsPromise
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function v3(v: [number, number, number] | undefined, fallback = '0 0 0'): string {
  return v ? `${v[0]} ${v[1]} ${v[2]}` : fallback
}

/** Half-height of an entity, used to float its label just above the geometry. */
function topOf(e: AREntity): number {
  switch (e.kind) {
    case 'sphere':
    case 'torus':
      return e.radius ?? 0.5
    default:
      return (e.height ?? 1) / 2
  }
}

function primitiveHtml(e: AREntity): string {
  const flat = e.kind === 'plane'
  const material = [
    `color: ${e.color ?? '#ffffff'}`,
    `opacity: ${e.opacity ?? 1}`,
    'transparent: true',
    'side: double',
    flat ? 'shader: flat' : '',
  ]
    .filter(Boolean)
    .join('; ')

  const common = `id="${esc(e.id)}" class="${e.tappable ? 'tappable' : ''}" rotation="${v3(
    e.rotation,
  )}" scale="${v3(e.scale, '1 1 1')}" material="${material}" data-color="${esc(e.color ?? '#ffffff')}"`

  const anim = e.animation ? ` animation="${esc(e.animation)}"` : ''
  const anim2 = e.animation2 ? ` animation__2="${esc(e.animation2)}"` : ''

  switch (e.kind) {
    case 'box':
      return `<a-box ${common}${anim}${anim2} width="${e.width ?? 1}" height="${e.height ?? 1}" depth="${e.depth ?? 1}"></a-box>`
    case 'cylinder':
      return `<a-cylinder ${common}${anim}${anim2} radius="${e.radius ?? 0.5}" height="${e.height ?? 1}"></a-cylinder>`
    case 'cone':
      return `<a-cone ${common}${anim}${anim2} radius-bottom="${e.radius ?? 0.5}" radius-top="0" height="${e.height ?? 1}"></a-cone>`
    case 'sphere':
      return `<a-sphere ${common}${anim}${anim2} radius="${e.radius ?? 0.5}"></a-sphere>`
    case 'torus':
      return `<a-torus ${common}${anim}${anim2} radius="${e.radius ?? 0.5}" radius-tubular="0.03"></a-torus>`
    case 'plane':
    case 'text':
    default:
      return `<a-plane ${common}${anim}${anim2} width="${e.width ?? 1}" height="${e.height ?? 1}"></a-plane>`
  }
}

function entityHtml(e: AREntity): string {
  let label = ''
  if (e.label) {
    // A-Frame's default MSDF font has no Devanagari/Ol Chiki glyphs, so
    // in-scene labels stay ASCII. Translated copy lives in the 2D HUD.
    const color = e.labelColor ?? '#ffffff'
    label =
      e.kind === 'plane'
        ? // Coplanar with the sign face, nudged forward to avoid z-fighting.
          `<a-text value="${esc(e.label)}" align="center" color="${color}" width="${(e.width ?? 1) * 2.4}" position="0 0 0.012" shader="msdf"></a-text>`
        : // Floating flat above the object, readable when looking down at a marker.
          `<a-text value="${esc(e.label)}" align="center" color="${color}" width="1.6" rotation="-90 0 0" position="0 ${(topOf(e) + 0.12).toFixed(3)} 0" shader="msdf"></a-text>`
  }

  // Wrapper carries position + visibility so the primitive keeps its own
  // rotation/scale and any label stays upright independently of it.
  return `<a-entity id="wrap-${esc(e.id)}" position="${v3(e.position)}" visible="false">${primitiveHtml(e)}${label}</a-entity>`
}

function sceneHtml(entities: AREntity[], mode: ARMode): string {
  const inner = entities.map(entityHtml).join('')

  if (mode === 'demo') {
    // Marker-less fallback for bad stage lighting or a failed camera permission.
    return `
      <a-scene embedded vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false"
        cursor="rayOrigin: mouse" raycaster="objects: .tappable"
        renderer="antialias: true; colorManagement: true"
        background="color: #0b1220">
        <a-entity id="anchor" position="0 -0.45 -2.4" rotation="-12 0 0">${inner}</a-entity>
        <a-entity camera="active: true" position="0 0 0"></a-entity>
        <a-light type="ambient" color="#ffffff" intensity="0.85"></a-light>
        <a-light type="directional" position="1 2 1" intensity="0.7"></a-light>
      </a-scene>`
  }

  return `
    <a-scene embedded vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false"
      cursor="rayOrigin: mouse" raycaster="objects: .tappable"
      renderer="antialias: true; alpha: true; colorManagement: true; logarithmicDepthBuffer: true"
      arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono; patternRatio: 0.5">
      <a-marker id="anchor" preset="hiro" smooth="true" smoothCount="10"
        smoothTolerance="0.01" smoothThreshold="5" raycaster="objects: .tappable">${inner}</a-marker>
      <a-entity camera></a-entity>
    </a-scene>`
}

export default function ARScene({
  entities,
  mode,
  onTap,
  onReady,
  onMarkerChange,
  onLoadError,
  ref,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  // Latest-callback refs: the parent re-renders freely, the scene never does.
  const tapRef = useRef(onTap)
  const readyRef = useRef(onReady)
  const markerRef = useRef(onMarkerChange)
  const errorRef = useRef(onLoadError)
  tapRef.current = onTap
  readyRef.current = onReady
  markerRef.current = onMarkerChange
  errorRef.current = onLoadError

  useImperativeHandle(
    ref,
    (): ARSceneHandle => ({
      showOnly(ids) {
        const host = hostRef.current
        if (!host) return
        host.querySelectorAll('[id^="wrap-"]').forEach((el) => {
          const id = el.id.slice('wrap-'.length)
          el.setAttribute('visible', ids.includes(id) ? 'true' : 'false')
        })
      },
      pulse(id, color) {
        const el = hostRef.current?.querySelector(`#${CSS.escape(id)}`) as
          | (Element & { setAttribute: (a: string, b: string) => void })
          | null
        if (!el) return
        const original = el.getAttribute('data-color') ?? '#ffffff'
        el.setAttribute('material', `color: ${color}; opacity: 1; transparent: true; side: double`)
        window.setTimeout(() => {
          el.setAttribute(
            'material',
            `color: ${original}; opacity: 1; transparent: true; side: double`,
          )
        }, 600)
      },
      markDone(id) {
        const el = hostRef.current?.querySelector(`#${CSS.escape(id)}`)
        if (!el) return
        el.setAttribute(
          'material',
          `color: ${DONE_COLOR}; opacity: 1; transparent: true; side: double`,
        )
      },
      resetColors() {
        hostRef.current?.querySelectorAll('[data-color]').forEach((el) => {
          const original = el.getAttribute('data-color') ?? '#ffffff'
          el.setAttribute(
            'material',
            `color: ${original}; opacity: 1; transparent: true; side: double`,
          )
        })
      },
    }),
    [],
  )

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    const disposers: Array<() => void> = []

    const build = () => {
      if (cancelled) return

      host.innerHTML = sceneHtml(entities, mode)
      const scene = host.querySelector('a-scene') as (HTMLElement & { hasLoaded?: boolean }) | null

      // One delegated listener beats one per entity, and it survives any
      // entity being recoloured or re-attached by A-Frame.
      const handleClick = (ev: Event) => {
        const target = ev.target as HTMLElement | null
        if (!target?.id) return
        if (!target.classList.contains('tappable')) return
        tapRef.current(target.id)
      }
      host.addEventListener('click', handleClick, true)
      disposers.push(() => host.removeEventListener('click', handleClick, true))

      const fireReady = () => readyRef.current?.()
      if (scene?.hasLoaded) fireReady()
      else scene?.addEventListener('loaded', fireReady, { once: true })

      const anchor = host.querySelector('#anchor')
      if (mode === 'marker') {
        const onFound = () => markerRef.current?.(true)
        const onLost = () => markerRef.current?.(false)
        anchor?.addEventListener('markerFound', onFound)
        anchor?.addEventListener('markerLost', onLost)
        disposers.push(() => {
          anchor?.removeEventListener('markerFound', onFound)
          anchor?.removeEventListener('markerLost', onLost)
        })
      } else {
        // Nothing to track in demo mode — the content is always "found".
        markerRef.current?.(true)
      }
    }

    if (mode === 'marker') {
      loadArJs().then(build, () => {
        if (!cancelled) errorRef.current?.()
      })
    } else {
      build()
    }

    return () => {
      cancelled = true
      disposers.forEach((dispose) => dispose())

      // AR.js appends its own <video> to <body> and holds the camera open.
      // Without this the torch stays on after navigating away — very visible
      // on a demo phone, and it blocks the next module from getting a stream.
      document.querySelectorAll('video').forEach((video) => {
        const stream = video.srcObject as MediaStream | null
        stream?.getTracks().forEach((t) => t.stop())
        video.srcObject = null
        if (!host.contains(video)) video.remove()
      })

      host.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // <-- MUST stay empty. See Decision 1 in the README, and CLAUDE.md.

  return <div ref={hostRef} className="absolute inset-0 z-0" />
}
