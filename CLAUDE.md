# SafeAR — working notes for Claude

WebAR industrial-safety training for SIH26041. React + A-Frame/AR.js + Supabase, deployed on Vercel.
Full documentation is in [README.md](README.md); this file covers only what is **not** visible from
reading the code.

## Four rules that look like cleanup opportunities and are not

Each of these looks like tidy-up-able code. Breaking any of them fails **silently** — the app still
compiles, the tests such as they are still pass, and the demo dies on stage instead.

### 1. Never let React re-render `<a-scene>`

`src/components/ARScene.tsx` builds the AR scene once, imperatively, inside a `useEffect` with an
**empty dependency array**, and exposes an imperative handle (`showOnly`, `pulse`, `markDone`).
Callbacks are read through latest-value refs so the parent can re-render freely.

- The empty deps array must stay empty. The `eslint-disable` above it is deliberate.
- Do not "fix" it by adding `entities` or `mode` to the deps, and do not move scene markup into JSX.
- A re-render that touches the scene remounts it and **kills the camera stream mid-session**.

React state in `ARModule.tsx` drives only the 2D HUD layered on top. Keep it that way.

### 2. Do not add `<StrictMode>` to `src/main.tsx`

Its absence is intentional and commented. StrictMode double-invokes effects, which for this app means
acquire camera → release → re-acquire. AR.js does not reliably survive that: the video element ends
up detached and the marker is never found, which looks exactly like "AR is broken."

### 3. In-scene text must stay ASCII

A-Frame's default MSDF font has **no Devanagari or Ol Chiki glyphs**. An `AREntity.label` containing
Hindi renders as blank or garbage, with no error.

- In-scene labels: `CO2`, `EXIT`, `SCBA MASK`, `ALL CLEAR`.
- All translated copy goes in the 2D HUD, which is plain DOM and renders any script.

### 4. AR.js stays lazily loaded, marker mode only

`ARScene.tsx` injects the AR.js script at runtime and only when `mode === 'marker'`.

Do not move it into `index.html`. A-Frame initialises a component's *system* from schema defaults on
**any** scene once the script is present, and AR.js's `arjs` system defaults to `sourceType: webcam`
— so merely including it made the marker-less fallback open the camera and paint a "Webcam Error"
banner over the scene. That fallback is the on-stage insurance; it must stay camera-free.

Because a loaded script cannot be unloaded, the AR-mode toggle in `ModuleSelect.tsx` deliberately
triggers a full page reload rather than a state update.

## Orientation

- **Modules are data, not code.** `src/modules/*.ts` are config files consumed by a generic engine in
  `ARModule.tsx`. To add a module, write a config — do not touch the engine. Steps support three
  completion modes: single tap, `requireAll` (any order), `requireAll + ordered` (strict sequence).
- **All persistence goes through `src/lib/data.ts`**, which falls back to `localStorage` whenever
  Supabase is unreachable. Do not call Supabase directly from a component.
- **`/verify` distinguishes four states**, not two: valid / expired / not-found / **unreachable**.
  Never collapse "cannot reach the register" into "invalid" — that would tell a DGMS inspector a
  legitimate worker's certificate is fake because the wifi dropped.
- **`src/locales/sat.json` is a placeholder.** Santali strings need a native speaker. Do not
  machine-translate into it: any key added there overrides the Hindi fallback, so a wrong translation
  is worse than an absent one.

## Before calling anything done

```bash
npm run build && npm run lint
```

Both must pass clean. After any change to `ARScene.tsx`, `ARModule.tsx`, or `Train.tsx`, also re-run
the scene-stability check: with the AR scene live, trigger a HUD state change (the 🔊 replay button)
and confirm the camera feed does not flicker or reload. That is the regression test for rule 1, and
it is the one thing a green build will not catch.

## Known limitation, already flagged

`supabase/schema.sql` grants anonymous `SELECT` on `certificates` with `using (true)`. Acceptable for
a hackathon demo over synthetic data; must be replaced with a `SECURITY DEFINER`
`verify_certificate(uuid)` function before any real pilot. See the note at the policy itself.

## Why not MongoDB Atlas (asked and answered)

The datastore looks swappable — all coupling is nine call sites in `src/lib/data.ts` behind
`hasSupabase` guards, plus one cosmetic import in `AdminLogin.tsx`. It is not, and the reason is
not in the code.

Supabase works from a static SPA because PostgREST is an HTTP API and the anon key is constrained
by RLS. MongoDB has no browser-safe equivalent: Atlas App Services / Realm Web SDK / Data API
reached EOL around September 2025. A connection string is a full-privilege TCP credential and
cannot ship in a Vite bundle.

So "move to Atlas" actually means: ~6 Vercel serverless routes, hand-rolled JWT admin auth
replacing Supabase Auth, the RLS policies re-implemented per route, `seed.sql` rewritten as a Node
script, and `data.ts` moved to `fetch('/api/...')`. Deferred past SIH26041 — the Supabase path was
already built and tested, and swapping datastores days before a demo means presenting code that
has never been run.

Worth doing afterwards, because it dissolves the limitation above: with a server route mediating
the lookup, the anonymous blanket `SELECT` on `certificates` is no longer needed at all.
