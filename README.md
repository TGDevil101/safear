# SafeAR

**AR-based vocational training simulator for industrial safety — Jharkhand mining & manufacturing.**
Smart India Hackathon 2026 · Problem Statement **SIH26041** · Government of Jharkhand, Dept. of Higher & Technical Education.

Workers complete interactive AR safety modules on any mid-range Android phone — no headset, no app
install — pass a scored assessment, and receive a QR-verifiable digital certificate. Safety officers
track compliance on a web dashboard; a DGMS inspector verifies a worker on the spot by scanning their
QR code.

Everything runs in mobile Chrome as WebAR. There is no APK and no ARCore dependency.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. It works immediately with **no Supabase account and no configuration** —
data falls back to `localStorage`. See [Running without a backend](#running-without-a-backend) for the
one caveat.

To use the real database, copy `.env.example` to `.env.local` and fill in your Supabase URL and anon
key, then run `supabase/schema.sql` followed by `supabase/seed.sql` in the Supabase SQL editor.

### Testing AR on a real phone

The camera API is blocked on non-HTTPS origins, and the `localhost` exemption **does not** extend to
your phone on the LAN. So `npm run dev` plus your machine's IP will *not* give you a camera.

Deploy to Vercel and test against the deployed URL:

```bash
npx vercel --prod
```

Then print the marker from `/markers/hiro-marker.html` (linked in-app from the module screen) and
point the phone at it.

---

## Routes

| Route | Who | What |
|---|---|---|
| `/worker` | Worker | Name + phone sign-in |
| `/modules` | Worker | Module list, AR-mode toggle |
| `/train/:moduleId` | Worker | AR training scene + debrief |
| `/quiz/:moduleId` | Worker | 5-question assessment |
| `/certificate/:certId` | Worker | Certificate card with QR |
| `/verify` | **Anyone, no login** | Certificate verification |
| `/admin` | Safety officer | Sign-in |
| `/admin/dashboard` | Safety officer | Compliance table, filters, CSV export |

---

## Architecture notes

Four decisions carry most of the weight. Each is also commented at its call site.

**1 · A-Frame lives outside the React render cycle.** A React re-render that touches `<a-scene>`
remounts it and kills the camera stream mid-demo. `ARScene.tsx` builds the scene exactly once in an
empty-deps effect and exposes an imperative handle (`showOnly`, `pulse`, `markDone`); React state
drives only the 2D HUD layered on top. **If you change `Train.tsx` or `ARModule.tsx`, re-run the scene
stability check in [Verification](#verification).**

For the same reason `main.tsx` does **not** use `<StrictMode>` — its double-invoked effects would
acquire, release and re-acquire the camera, which AR.js does not reliably survive.

**2 · No 3D models.** Every scene is built from A-Frame primitives (`a-box`, `a-cone`, `a-plane`…).
This removes the GLTF asset pipeline entirely, and with it the "3D assets too heavy" performance risk.
Adding a model later is easy; needing one on day one is not.

**3 · One data-driven step engine.** `ARModule.tsx` knows nothing about fire or gas. A module is a
config file in `src/modules/` — a list of steps, each with entities, correct target ids, and i18n
keys. `module2-gas.ts` was added without touching the engine, and modules 3–5 work the same way.

Steps support three completion modes: a single correct tap, `requireAll` (any order), and
`requireAll + ordered` (strict sequence — used for the evacuation headcount and the buddy-system roles).

**4 · AR.js is loaded on demand, marker mode only.** A-Frame initialises a component's *system* from
schema defaults on every scene, whether or not the attribute is present. AR.js's `arjs` system defaults
to `sourceType: webcam`, so merely having the script on the page made the marker-less demo mode request
a camera and then paint a "Webcam Error" banner over the scene. `ARScene.tsx` injects the script only
when `mode === 'marker'`; a demo-mode session never touches the camera at all.

Because a loaded script cannot be unloaded, switching the AR-mode toggle triggers a full page reload.

### In-scene text is ASCII-only

A-Frame's default MSDF font has no Devanagari or Ol Chiki glyphs. Labels *inside* the AR scene stay
ASCII (`CO2`, `EXIT`, `SCBA MASK`); all translated copy lives in the 2D HUD, which is plain DOM and
renders any script. Do not put Hindi into an `AREntity.label`.

### Audio narration degrades gracefully

`src/lib/narrate.ts` plays `/audio/<lang>/<file>.mp3` if it exists, and otherwise falls back to the
browser's speech synthesiser reading the translated prompt. **Narration therefore works right now with
zero recordings**, and dropping an MP3 into `public/audio/hi/` silently upgrades that step. Nothing
breaks if the recordings never happen.

(There is no Santali speech-synthesis voice on Android, so `sat` falls back to a Hindi voice while the
on-screen text stays Ol Chiki.)

---

## Data & privacy

All persistence goes through `src/lib/data.ts`. Every call degrades to `localStorage` when Supabase is
unreachable, so a dead venue network downgrades the demo instead of ending it.

Two deliberate choices worth knowing about:

- **`certificates.worker_name` is denormalised.** `/verify` is anonymous, and this lets a public read
  on the certificates table alone answer an inspector's scan without exposing the `workers` table —
  and every worker's name and phone number — to the internet.
- **Worker registration goes through a `SECURITY DEFINER` function**, `register_worker()`, not a plain
  insert. The `workers` table has no anonymous select policy, and without one an `insert().select()`
  cannot return the new row. The function also lets a returning worker keep their existing id, and
  therefore their training history.

### ⚠ Known security limitation — fix before any real deployment

`schema.sql` grants anonymous `SELECT` on `certificates` with `using (true)`. Certificate ids are v4
UUIDs and unguessable, but this policy **does** permit an anonymous client to enumerate the whole table
through PostgREST. That is acceptable for a hackathon demo over synthetic data and **not** acceptable
for a pilot with real workers.

The fix: replace it with a `SECURITY DEFINER` function `verify_certificate(uuid)` returning a single
row, and drop the blanket select policy. This is flagged in `supabase/schema.sql` at the policy itself.

### Running without a backend

With no `VITE_SUPABASE_*` env vars the app is fully usable, **except** that a certificate issued on one
device cannot be verified from another — which is exactly what the QR scan does. In that mode `/verify`
reports *"cannot verify"* rather than *"not found"*: telling an inspector that a legitimate worker's
certificate is invalid because the network dropped would be a serious failure of that screen's job. The
three states are kept distinct throughout.

Set the env vars for any demo where someone else scans the QR code.

---

## Localisation status

| Language | Status |
|---|---|
| Hindi (`hi`) | **Complete** — all worker-facing UI, module content, quiz content. Default language. |
| English (`en`) | **Complete** — fallback, and the admin dashboard's language. |
| Santali (`sat`) | **Placeholder — needs a native speaker.** |

The Santali *infrastructure* is finished and proven: the language appears in the switcher, Noto Sans Ol
Chiki loads, the script renders correctly, and the fallback chain is `sat → hi → en` so untranslated
keys show Hindi rather than English.

The Santali *translations* are not. `src/locales/sat.json` contains only strings verifiable without a
Santali speaker. **Do not machine-translate into that file, and do not present Santali as complete to
judges or to DGMS until a native speaker has reviewed it.** Any key added there immediately overrides
the Hindi fallback, so a wrong translation is worse than an absent one.

---

## Scope

Built to the PRD's §13 demo script. Deliberately **out of scope** for this build:

- Modules 3–5 (machinery, electrical, fall protection) — the engine takes them as config files
- Santali audio narration
- OTP worker authentication (name + phone only)
- Native Android APK (WebAR is the approach)
- PWA service worker / offline sync queue with conflict resolution
- DGMS API integration, multi-site admin hierarchy

**On "works offline":** module content is bundled and the quiz submits to `localStorage`, so a session
survives losing the network mid-module. But there is **no service worker**, so the app will not
cold-start without a connection, and `/verify` genuinely requires one.

> **Demo wording — use this line, not the one in the PRD.** The PRD's §13 script says *"Works offline
> for mines without internet."* That is not true of this build. Say instead:
>
> > *"Module content is bundled on the device, so training keeps working if the connection drops
> > mid-shift. Full offline sync is the next build."*
>
> This was a deliberate scope decision, not an oversight — the PRD lists offline as a SHOULD and puts
> PWA in its own drop list. Claiming it outright in front of DGMS would be a misrepresentation.

---

## Verification

Run these on a real phone, not a desktop emulator. Items 1 and 2 are the ones that fail silently.

1. **AR acquisition** — open the deployed HTTPS URL on the demo phone and point at the printed Hiro
   marker: the scene appears and tracks as the phone moves.
2. **Scene stability (regression test for Decision 1)** — with the scene live, trigger a HUD state
   change (tap the 🔊 replay button). The camera feed must not flicker or reload.
3. **Step engine** — walk all 5 steps of each module including a deliberate wrong tap per step: the
   feedback fires and the step does not advance. On the ordered steps (fire step 4, gas step 3),
   tapping out of sequence is rejected.
4. **Quiz** — 3/5 → fail screen with explanations and a 60s cooldown; 4/5 → pass, and rows appear in
   `completions` and `certificates`.
5. **QR round trip** — scan the certificate QR **from a second physical phone** at ~40 cm: `/verify`
   shows the right name, module, score and validity. Then try `/verify?id=<random-uuid>` → NOT FOUND.
6. **Dashboard** — the new completion appears, the department filter narrows it, and the CSV downloads
   and opens in Excel with Devanagari intact and the same date as the table.
7. **Language** — switch to Hindi on every worker screen: no English leaks, no raw i18n keys.
8. **Degradation** — turn off wifi mid-session: the module still runs and the quiz still submits.
9. **Full script** — run the demo end to end, timed, three times. Target ≤ 2 minutes.

```bash
npm run build     # tsc -b && vite build — must pass clean
```

---

## Demo-day checklist

- Demo phone: Chrome on the deployed URL, signed in, **brightness maxed, auto-lock off, Do Not Disturb on**
- Hiro marker: A4, matte paper, taped flat to card, out of direct glare
- Laptop: dashboard open and filtered; a second tab already on `/verify`
- Second phone: camera app open, ready to scan
- Phone hotspot on standby — `/verify` is the one hard network dependency
- If lighting or the camera defeats tracking: switch the module screen to **"No marker"** and carry on
- **Closing line:** use the corrected offline wording under [Scope](#scope), not the PRD's version,
  and do not claim Santali is complete unless a native speaker has reviewed `sat.json`

---

## Stack

Vite · React 19 · TypeScript · Tailwind CSS 4 · A-Frame 1.5 + AR.js 3.4 (Hiro marker) · Supabase
(Postgres + Auth) · qrcode.react · i18next · Vercel.

## Licence

MIT — see [LICENSE](LICENSE).
