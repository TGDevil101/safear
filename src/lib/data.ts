import { supabase, hasSupabase } from './supabase'

/**
 * The single door to persistence (see README, "Data & privacy").
 *
 * Every read and write goes through here. When Supabase is unreachable — no
 * env vars, dead wifi, rate limit — each call degrades to localStorage instead
 * of throwing, so a network failure downgrades the demo rather than ending it.
 *
 * The one honest exception is getCertificate(), which a DGMS inspector hits
 * from a *different phone*. localStorage cannot serve that, so it returns
 * `remoteUnavailable` and the verify page says so plainly rather than
 * pretending a certificate is invalid.
 */

export interface Worker {
  id: string
  name: string
  phone: string
  department: string
  created_at: string
}

export interface Completion {
  id: string
  worker_id: string
  module_id: string
  score: number
  passed: boolean
  attempts: number
  completed_at: string
}

export interface Certificate {
  id: string
  worker_id: string
  /** Denormalised so /verify can be served by a public read on this table
   *  alone, without exposing the workers table to anonymous clients. */
  worker_name: string
  department: string
  module_id: string
  score: number
  issued_at: string
  valid_until: string
}

const K = {
  worker: 'safear.worker',
  workers: 'safear.workers',
  completions: 'safear.completions',
  certificates: 'safear.certificates',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode / quota. Nothing useful to do; the session still works.
  }
}

function uuid(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  // Older Android WebViews. Not cryptographically ideal, but certificate IDs
  // created this way still go through Supabase on any real deployment.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ---------------------------------------------------------------- session

export function currentWorker(): Worker | null {
  return read<Worker | null>(K.worker, null)
}

export function signOutWorker(): void {
  localStorage.removeItem(K.worker)
}

export async function signInWorker(
  name: string,
  phone: string,
  department: string,
): Promise<Worker> {
  const local: Worker = {
    id: uuid(),
    name: name.trim(),
    phone: phone.trim(),
    department,
    created_at: new Date().toISOString(),
  }

  if (hasSupabase && supabase) {
    try {
      // Goes through a SECURITY DEFINER function rather than a plain insert.
      // The workers table has no anonymous select policy — exposing every
      // worker's name and phone to the internet would be a real privacy leak —
      // and without one an `insert().select()` cannot return the new row.
      // The function also makes a returning worker keep their existing id, and
      // therefore their training history.
      const { data, error } = await supabase.rpc('register_worker', {
        p_name: local.name,
        p_phone: local.phone,
        p_department: department,
      })

      if (!error && data) {
        const worker: Worker = { ...local, id: data as string }
        write(K.worker, worker)
        return worker
      }
    } catch {
      // fall through to local
    }
  }

  const workers = read<Worker[]>(K.workers, [])
  const prior = workers.find((w) => w.phone === local.phone)
  const worker = prior ?? local
  if (!prior) write(K.workers, [...workers, worker])
  write(K.worker, worker)
  return worker
}

// ------------------------------------------------------------ completions

export async function recordCompletion(
  workerId: string,
  moduleId: string,
  score: number,
  passed: boolean,
  attempts: number,
): Promise<void> {
  const row: Completion = {
    id: uuid(),
    worker_id: workerId,
    module_id: moduleId,
    score,
    passed,
    attempts,
    completed_at: new Date().toISOString(),
  }

  write(K.completions, [...read<Completion[]>(K.completions, []), row])

  if (hasSupabase && supabase) {
    try {
      await supabase.from('completions').insert({
        worker_id: workerId,
        module_id: moduleId,
        score,
        passed,
        attempts,
      })
    } catch {
      // Queued locally. A real sync worker is the finals build (PRD 11).
    }
  }
}

export function localCompletions(workerId: string): Completion[] {
  return read<Completion[]>(K.completions, []).filter((c) => c.worker_id === workerId)
}

export function passedModules(workerId: string): string[] {
  return [...new Set(localCompletions(workerId).filter((c) => c.passed).map((c) => c.module_id))]
}

// ----------------------------------------------------------- certificates

export async function createCertificate(
  worker: Worker,
  moduleId: string,
  score: number,
): Promise<Certificate> {
  const issued = new Date()
  const validUntil = new Date(issued)
  validUntil.setFullYear(validUntil.getFullYear() + 1) // PRD 5.3: 1 year

  const cert: Certificate = {
    id: uuid(),
    worker_id: worker.id,
    worker_name: worker.name,
    department: worker.department,
    module_id: moduleId,
    score,
    issued_at: issued.toISOString(),
    valid_until: validUntil.toISOString(),
  }

  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .insert({
          worker_id: worker.id,
          worker_name: worker.name,
          department: worker.department,
          module_id: moduleId,
          score,
          issued_at: cert.issued_at,
          valid_until: cert.valid_until,
        })
        .select()
        .single()

      if (!error && data) {
        const saved = data as Certificate
        write(K.certificates, [...read<Certificate[]>(K.certificates, []), saved])
        return saved
      }
    } catch {
      // fall through
    }
  }

  write(K.certificates, [...read<Certificate[]>(K.certificates, []), cert])
  return cert
}

export type CertLookup =
  | { status: 'found'; cert: Certificate }
  | { status: 'notFound' }
  | { status: 'remoteUnavailable' }

export async function getCertificate(id: string): Promise<CertLookup> {
  const local = read<Certificate[]>(K.certificates, []).find((c) => c.id === id)

  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      if (data) return { status: 'found', cert: data as Certificate }
      return local ? { status: 'found', cert: local } : { status: 'notFound' }
    } catch {
      // Network died. If this device happens to hold the certificate we can
      // still show it; otherwise say "cannot reach the register" rather than
      // "invalid", which would wrongly accuse a legitimate worker.
      return local ? { status: 'found', cert: local } : { status: 'remoteUnavailable' }
    }
  }

  if (local) return { status: 'found', cert: local }
  // No backend configured at all: a certificate issued on another device is
  // unverifiable here, and saying "not found" would be a lie.
  return { status: 'remoteUnavailable' }
}

export function certificateFor(workerId: string, moduleId: string): Certificate | undefined {
  return read<Certificate[]>(K.certificates, [])
    .filter((c) => c.worker_id === workerId && c.module_id === moduleId)
    .sort((a, b) => b.issued_at.localeCompare(a.issued_at))[0]
}

export function isValid(cert: Certificate): boolean {
  return new Date(cert.valid_until).getTime() > Date.now()
}

// ------------------------------------------------------------------ admin

export interface WorkerRow extends Worker {
  modules_passed: string[]
  last_score: number | null
  last_assessment: string | null
  cert_status: 'valid' | 'expired' | 'pending'
  cert_id: string | null
}

/** Joined view backing the compliance dashboard (PRD 5.4). */
export async function listWorkerRows(): Promise<WorkerRow[]> {
  let workers = read<Worker[]>(K.workers, [])
  let completions = read<Completion[]>(K.completions, [])
  let certificates = read<Certificate[]>(K.certificates, [])

  if (hasSupabase && supabase) {
    try {
      const [w, c, cert] = await Promise.all([
        supabase.from('workers').select('*'),
        supabase.from('completions').select('*'),
        supabase.from('certificates').select('*'),
      ])
      if (w.data) workers = w.data as Worker[]
      if (c.data) completions = c.data as Completion[]
      if (cert.data) certificates = cert.data as Certificate[]
    } catch {
      // Keep the local snapshot.
    }
  }

  return workers.map((worker) => {
    const mine = completions
      .filter((c) => c.worker_id === worker.id)
      .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    const myCerts = certificates
      .filter((c) => c.worker_id === worker.id)
      .sort((a, b) => b.issued_at.localeCompare(a.issued_at))
    const latestCert = myCerts[0]

    return {
      ...worker,
      modules_passed: [...new Set(mine.filter((c) => c.passed).map((c) => c.module_id))],
      last_score: mine[0]?.score ?? null,
      last_assessment: mine[0]?.completed_at ?? null,
      cert_status: !latestCert ? 'pending' : isValid(latestCert) ? 'valid' : 'expired',
      cert_id: latestCert?.id ?? null,
    }
  })
}

export async function adminSignIn(email: string, password: string): Promise<boolean> {
  if (!hasSupabase || !supabase) {
    // Local-only mode: the dashboard is still demonstrable without an auth
    // backend. Real deployments always have Supabase configured.
    return true
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return !error
}

export async function adminSignOut(): Promise<void> {
  await supabase?.auth.signOut()
}

export async function adminSession(): Promise<boolean> {
  if (!hasSupabase || !supabase) return false
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session)
}
