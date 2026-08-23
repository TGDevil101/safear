import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminSignOut, listWorkerRows, type WorkerRow } from '../lib/data'
import { MODULES } from '../modules'

/**
 * /admin/dashboard — the compliance dashboard (PRD 5.4).
 *
 * Filter by department / module / status, then export the filtered set as CSV
 * for DGMS reporting. The export deliberately reflects the *filtered* rows,
 * not the whole table — the point is to hand over exactly one department's
 * compliance evidence.
 */

const DEPARTMENTS = ['mining', 'processing', 'steel', 'maintenance', 'contract'] as const
const STATUSES = ['valid', 'expired', 'pending'] as const

/** Local calendar date. `toISOString().slice(0,10)` is UTC and lands on the
 *  previous day for evening IST assessments, which then disagrees with the
 *  date shown in the table right next to the export button. */
function localDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toCsv(
  rows: WorkerRow[],
  moduleName: (id: string) => string,
  deptName: (id: string) => string,
): string {
  const header = [
    'Name',
    'Phone',
    'Department',
    'Modules Passed',
    'Last Assessment',
    'Last Score',
    'Certificate Status',
    'Certificate ID',
  ]
  // Quote every field and double internal quotes: worker names and department
  // labels can contain commas, and a broken CSV is a broken DGMS report.
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const lines = rows.map((r) =>
    [
      r.name,
      r.phone,
      deptName(r.department),
      r.modules_passed.map(moduleName).join(' | '),
      r.last_assessment ? localDate(r.last_assessment) : '',
      r.last_score ?? '',
      r.cert_status,
      r.cert_id ?? '',
    ]
      .map(escape)
      .join(','),
  )

  return [header.map(escape).join(','), ...lines].join('\r\n')
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [rows, setRows] = useState<WorkerRow[] | null>(null)
  const [dept, setDept] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    void listWorkerRows().then(setRows)
  }, [])

  const moduleName = (id: string) => {
    const m = MODULES.find((x) => x.id === id)
    return m ? t(m.nameKey) : id
  }

  const filtered = useMemo(() => {
    if (!rows) return []
    const q = search.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (!dept || r.department === dept) &&
        (!moduleId || r.modules_passed.includes(moduleId)) &&
        (!status || r.cert_status === status) &&
        (!q || r.name.toLowerCase().includes(q) || r.phone.includes(q)),
    )
  }, [rows, dept, moduleId, status, search])

  const exportCsv = () => {
    const deptName = (id: string) => t(`departments.${id}`)
    const blob = new Blob([`﻿${toCsv(filtered, moduleName, deptName)}`], {
      // The BOM makes Excel open Devanagari names correctly instead of mojibake.
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safear-compliance-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    const all = rows ?? []
    return {
      total: all.length,
      certified: all.filter((r) => r.cert_status === 'valid').length,
      pending: all.filter((r) => r.cert_status === 'pending').length,
      expired: all.filter((r) => r.cert_status === 'expired').length,
    }
  }, [rows])

  const badge = (s: WorkerRow['cert_status']) =>
    s === 'valid'
      ? 'bg-green-600/20 text-green-400'
      : s === 'expired'
        ? 'bg-amber-600/20 text-amber-400'
        : 'bg-white/10 text-ink-400'

  return (
    <div className="min-h-dvh bg-ink-900 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-brand-500">SafeAR</p>
            <h1 className="text-2xl font-bold">{t('admin.dashTitle')}</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/verify" className="rounded-lg bg-white/10 px-4 py-2 text-sm">
              {t('admin.quickVerify')}
            </Link>
            <button
              onClick={async () => {
                await adminSignOut()
                navigate('/admin')
              }}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm"
            >
              {t('admin.signOut')}
            </button>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t('admin.totalWorkers'), value: stats.total, color: 'text-white' },
            { label: t('admin.certified'), value: stats.certified, color: 'text-green-400' },
            { label: t('admin.pending'), value: stats.pending, color: 'text-ink-400' },
            { label: t('admin.expiring'), value: stats.expired, color: 'text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-ink-800 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-400">{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.search')}
            className="min-w-48 flex-1 rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm"
          >
            <option value="">{t('admin.filterDept')}</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {t(`departments.${d}`)}
              </option>
            ))}
          </select>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm"
          >
            <option value="">{t('admin.filterModule')}</option>
            {MODULES.map((m) => (
              <option key={m.id} value={m.id}>
                {t(m.nameKey)}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm"
          >
            <option value="">{t('admin.filterStatus')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`admin.status${s[0].toUpperCase()}${s.slice(1)}`)}
              </option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            ⭳ {t('admin.export')}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="bg-ink-800 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">{t('admin.colName')}</th>
                <th className="px-4 py-3">{t('admin.colPhone')}</th>
                <th className="px-4 py-3">{t('admin.colDept')}</th>
                <th className="px-4 py-3">{t('admin.colModules')}</th>
                <th className="px-4 py-3">{t('admin.colLast')}</th>
                <th className="px-4 py-3">{t('admin.colScore')}</th>
                <th className="px-4 py-3">{t('admin.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {rows === null && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-400">
                    {t('common.loading')}
                  </td>
                </tr>
              )}
              {rows !== null && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-400">
                    {t('admin.empty')}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-ink-400">{r.phone}</td>
                  <td className="px-4 py-3 text-ink-400">{t(`departments.${r.department}`)}</td>
                  <td className="px-4 py-3">
                    {r.modules_passed.length === 0
                      ? '—'
                      : r.modules_passed.map(moduleName).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-ink-400">
                    {r.last_assessment ? new Date(r.last_assessment).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">{r.last_score !== null ? `${r.last_score}%` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${badge(r.cert_status)}`}>
                      {t(
                        `admin.status${r.cert_status[0].toUpperCase()}${r.cert_status.slice(1)}`,
                      )}
                    </span>
                    {r.cert_id && (
                      <Link
                        to={`/verify?id=${r.cert_id}`}
                        className="ml-2 text-xs text-brand-500 underline"
                      >
                        ↗
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-ink-400">
          {filtered.length} / {rows?.length ?? 0}
        </p>
      </div>
    </div>
  )
}
