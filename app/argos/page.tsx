'use client'

import { useState, useEffect } from 'react'

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(v: number | null, dec = 0, suffix = '') {
  if (v == null) return '—'
  return v.toLocaleString('es-ES', {
    minimumFractionDigits: dec, maximumFractionDigits: dec
  }) + suffix
}

function Badge({ v }: { v: number | null }) {
  if (v == null) return <span className="text-gray-400">—</span>
  const good = v >= 0
  const cls = good
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-red-50 text-red-700 border border-red-200'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {v > 0 ? '+' : ''}{(v * 100).toFixed(1)}%
    </span>
  )
}

type Row = Record<string, any>

export default function ArgosPage() {
  const [year] = useState(2026)
  const [month] = useState(3)
  const [medofis, setMedofis] = useState('MEDOR')
  const [lob, setLob] = useState('Total')
  const [data, setData] = useState<Row[]>([])
  const [vidaData, setVidaData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'novida' | 'vida'>('novida')

  useEffect(() => {
    setLoading(true)
    const base = `/api/argos?year=${year}&month=${month}&medor=742776`
    Promise.all([
      fetch(`${base}&tipo=novida&medofis=${medofis}`).then(r => r.json()),
      fetch(`${base}&tipo=vida`).then(r => r.json()),
    ]).then(([nv, v]) => {
      setData(nv.data || [])
      setVidaData(v.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [year, month, medofis])

  const allMedofis = ['MEDOR', '742776', '742826', '742821', '755224']
  const allLobs = ['Total', 'PARTICULARES', 'EMPRESAS', 'SALUD']

  const noVidaRows = data.filter(r =>
    lob === 'Total' ? (r.lob === 'Total' && r.subramo === '') : r.lob === lob
  )

  const kpiRow = data.find(r => r.lob === 'Total' && r.subramo === '') || null
  const vidaTotal = vidaData.find(r => r.negocio === 'Total' && r.lob === 'Total')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel ARGOS</h1>
          <p className="text-sm text-slate-500 mt-0.5">{MESES[month]} {year} · Datos reales AXA</p>
        </div>
        <div className="flex gap-2">
          <select value={medofis} onChange={e => setMedofis(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm">
            {allMedofis.map(m => (
              <option key={m} value={m}>{m === 'MEDOR' ? 'MEDOR (agrupado)' : m}</option>
            ))}
          </select>
        </div>
      </div>

      {kpiRow && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'GWP', value: fmt(kpiRow.gwp, 0, ' €'), sub: kpiRow.gwp_pct != null ? (kpiRow.gwp_pct > 0 ? '+' : '') + (kpiRow.gwp_pct * 100).toFixed(1) + '%' : '—' },
            { label: 'Pólizas', value: fmt(kpiRow.pol), sub: `Net: ${kpiRow.net_inflow ?? '—'}` },
            { label: 'GWP NP', value: fmt(kpiRow.gwpnp, 0, ' €'), sub: kpiRow.var_gwpnp_pct != null ? (kpiRow.var_gwpnp_pct > 0 ? '+' : '') + (kpiRow.var_gwpnp_pct * 100).toFixed(1) + '%' : '—' },
            { label: 'Siniestralidad', value: kpiRow.siniestralidad_sin_ibnr != null ? (kpiRow.siniestralidad_sin_ibnr * 100).toFixed(1) + '%' : '—', sub: 'sin IBNR' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="border-b border-slate-200 flex">
        {(['novida', 'vida'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            {t === 'novida' ? 'No Vida' : 'Vida'}
          </button>
        ))}
      </div>

      {loading && <div className="py-16 text-center text-slate-400">Cargando datos...</div>}

      {!loading && tab === 'novida' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {allLobs.map(l => (
              <button key={l} onClick={() => setLob(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  lob === l ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                {l}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {lob === 'Total'
                    ? <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">LOB</th>
                    : <><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Ramo</th>
                       <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Subramo</th></>
                  }
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Pólizas</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Net</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">GWP €</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Var GWP</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">NP</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">GWP NP €</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Var NP</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Renov.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Siniest.</th>
                </tr>
              </thead>
              <tbody>
                {noVidaRows.length === 0 && (
                  <tr><td colSpan={11} className="text-center py-12 text-slate-400">Sin datos</td></tr>
                )}
                {noVidaRows.map((r, i) => (
                  <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${r.lob === 'Total' ? 'font-semibold bg-slate-50' : ''}`}>
                    {lob === 'Total'
                      ? <td className="px-4 py-2.5">{r.lob}</td>
                      : <><td className="px-4 py-2.5 text-slate-600">{r.ramo || '—'}</td>
                         <td className="px-4 py-2.5 text-slate-500 text-xs">{r.subramo || '—'}</td></>
                    }
                    <td className="px-4 py-2.5 text-right">{fmt(r.pol)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={r.net_inflow != null && r.net_inflow >= 0 ? 'text-emerald-600' : 'text-red-600'}>
