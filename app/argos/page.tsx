'use client'

import { useState, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
type Row = Record<string, any>

// ─── Constants ───────────────────────────────────────────────────────────────
const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const YEARS = [2024, 2025, 2026, 2027]
const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

const ALL_MEDOFIS = ['MEDOR', '742776', '742826', '742821', '755224']

const LOB_ORDER: Record<string, number> = {
  PARTICULARES: 1,
  EMPRESAS: 2,
  SALUD: 3,
  Total: 4,
}

// ─── No Vida column definitions ──────────────────────────────────────────────
const NV_COLS: { label: string; key: string; type: 'text' | 'int' | 'euro' | 'pct' | 'pct1' | 'badge' }[] = [
  { label: 'LoB',                   key: 'lob',                      type: 'text'  },
  { label: 'Ramo',                  key: 'ramo',                     type: 'text'  },
  { label: 'Subramo',               key: 'subramo',                  type: 'text'  },
  { label: '% Renov. Primas',       key: 'renov_primas_pct',         type: 'pct'   },
  { label: '% Caída Pólizas',       key: 'caida_polizas_pct',        type: 'pct'   },
  { label: 'TR Pólizas',            key: 'tr_polizas',               type: 'pct'   },
  { label: 'TR Pólizas Ant',        key: 'tr_polizas_ant',           type: 'pct'   },
  { label: '% Tasa NP',             key: 'tasa_np_pct',              type: 'pct'   },
  { label: '% Tasa NP M.Equip.',    key: 'tasa_np_mequip_pct',       type: 'pct'   },
  { label: '% Tasa NP M.Equip./NP', key: 'tasa_np_mequip_np_pct',   type: 'pct'   },
  { label: 'NP',                    key: 'np',                       type: 'int'   },
  { label: 'NP Ant',                key: 'np_ant',                   type: 'int'   },
  { label: '% Var NP',              key: 'var_np_pct',               type: 'badge' },
  { label: 'POL',                   key: 'pol',                      type: 'int'   },
  { label: 'Net Inflow',            key: 'net_inflow',               type: 'int'   },
  { label: 'GWP',                   key: 'gwp',                      type: 'euro'  },
  { label: 'GWPA',                  key: 'gwpa',                     type: 'euro'  },
  { label: '% GWP',                 key: 'gwp_pct',                  type: 'badge' },
  { label: 'GWPNP',                 key: 'gwpnp',                    type: 'euro'  },
  { label: 'GWPNPA',                key: 'gwpnpa',                   type: 'euro'  },
  { label: '% Var GWPNP',           key: 'var_gwpnp_pct',            type: 'badge' },
  { label: 'GWPNP Media',           key: 'gwpnp_media',              type: 'euro'  },
  { label: '% Var GWPNP Media',     key: 'var_gwpnp_media_pct',      type: 'badge' },
  { label: 'Primas Adq.',           key: 'primas_adq',               type: 'euro'  },
  { label: '% Var P.Adq',           key: 'var_p_adq_pct',            type: 'badge' },
  { label: '% PTE P.Adq',           key: 'pte_p_adq_pct',            type: 'pct'   },
  { label: 'Siniest. sin IBNR',     key: 'siniestralidad_sin_ibnr',  type: 'pct1'  },
  { label: 'SCCY',                  key: 'sccy',                     type: 'int'   },
  { label: '% SCCY',                key: 'sccy_pct',                 type: 'pct'   },
  { label: 'SCCY Ant',              key: 'sccy_ant',                 type: 'int'   },
  { label: 'Dif SCCY',              key: 'dif_sccy',                 type: 'int'   },
  { label: 'SCCY Leves',            key: 'sccy_leves',               type: 'int'   },
  { label: 'SCCY Leves Ant',        key: 'sccy_leves_ant',           type: 'int'   },
  { label: 'Dif SCCY Leves',        key: 'dif_sccy_leves',           type: 'int'   },
  { label: 'SP NP',                 key: 'sp_np',                    type: 'euro'  },
  { label: 'SP Ant',                key: 'sp_ant',                   type: 'euro'  },
  { label: 'Dif SP NP',             key: 'dif_sp_np',                type: 'int'   },
  { label: 'SCCY+C.Adq',           key: 'sccy_cadq',                type: 'int'   },
  { label: 'SCCY+C.Adq Ant',       key: 'sccy_cadq_ant',            type: 'int'   },
  { label: 'Dif SCCY+C.Adq',       key: 'dif_sccy_cadq',            type: 'int'   },
  { label: 'Importe COR',           key: 'importe_cor',              type: 'euro'  },
  { label: 'COR',                   key: 'cor',                      type: 'pct1'  },
  { label: 'Margen YTD',            key: 'margen_ytd',               type: 'euro'  },
]

// ─── Vida column definitions ──────────────────────────────────────────────────
const V_COLS: { label: string; key: string; type: 'text' | 'int' | 'euro' | 'pct' | 'pct1' | 'badge' }[] = [
  { label: 'Negocio',          key: 'negocio',          type: 'text'  },
  { label: 'LoB',              key: 'lob',              type: 'text'  },
  { label: '% Renov Primas',   key: 'renov_primas_pct', type: 'pct'   },
  { label: 'Tasa NP',          key: 'tasa_np',          type: 'pct'   },
  { label: 'Tasa NP M.Equip',  key: 'tasa_np_mequip',   type: 'pct'   },
  { label: 'Pólizas',          key: 'polizas',          type: 'int'   },
  { label: 'Caída',            key: 'caida',            type: 'int'   },
  { label: 'TR Pólizas',       key: 'tr_polizas',       type: 'pct'   },
  { label: 'TR Pólizas Ant',   key: 'tr_polizas_ant',   type: 'pct'   },
  { label: 'Pólizas NP',       key: 'polizas_np',       type: 'int'   },
  { label: 'Pólizas NP Ant',   key: 'polizas_np_ant',   type: 'int'   },
  { label: '% Var Pol NP',     key: 'var_polnp_pct',    type: 'badge' },
  { label: 'Net Inflow',       key: 'net_inflow',       type: 'int'   },
  { label: 'GWPNP',            key: 'gwpnp',            type: 'euro'  },
  { label: 'GWPNPA',           key: 'gwpnpa',           type: 'euro'  },
  { label: '% Var GWPNP',      key: 'var_gwpnp_pct',    type: 'badge' },
  { label: 'CSM',              key: 'csm',              type: 'euro'  },
  { label: 'GWP',              key: 'gwp',              type: 'euro'  },
  { label: 'GWPA',             key: 'gwpa',             type: 'euro'  },
  { label: '% Var GWP',        key: 'var_gwp_pct',      type: 'badge' },
  { label: 'GWPPP',            key: 'gwppp',            type: 'euro'  },
  { label: '% Var GWPPP',      key: 'var_gwppp_pct',    type: 'badge' },
  { label: 'GWPPPU',           key: 'gwpppu',           type: 'euro'  },
  { label: '% Var GWPPPU',     key: 'var_gwpppu_pct',   type: 'badge' },
  { label: 'GWPNPPU',          key: 'gwpnppu',          type: 'euro'  },
  { label: 'APE',              key: 'ape',              type: 'euro'  },
  { label: '% Var APE',        key: 'var_ape_pct',      type: 'badge' },
  { label: 'P Mat',            key: 'p_mat',            type: 'euro'  },
  { label: 'P Mat n-1',        key: 'p_mat_n1',         type: 'euro'  },
  { label: 'Var P Mat',        key: 'var_pmat',         type: 'euro'  },
  { label: 'Venc',             key: 'venc',             type: 'euro'  },
  { label: '% Var Venc',       key: 'var_venc_pct',     type: 'badge' },
  { label: 'Resc',             key: 'resc',             type: 'euro'  },
  { label: '% Var Rescat',     key: 'var_rescat_pct',   type: 'badge' },
  { label: 'Siniest',          key: 'siniest',          type: 'euro'  },
  { label: '% Var Capital',    key: 'var_capital_pct',  type: 'badge' },
  { label: 'Rentas',           key: 'rentas',           type: 'euro'  },
  { label: '% Var Rentas',     key: 'var_rentas_pct',   type: 'badge' },
  { label: 'Otros',            key: 'otros',            type: 'euro'  },
  { label: '% Var Otros',      key: 'var_otros_pct',    type: 'badge' },
  { label: 'Prestaciones',     key: 'prestaciones',     type: 'euro'  },
  { label: '% Var Presta',     key: 'var_presta_pct',   type: 'badge' },
  { label: 'Cash Flow',        key: 'cash_flow',        type: 'euro'  },
  { label: 'Var Cash Flow',    key: 'var_cash_flow',    type: 'euro'  },
  { label: 'COR',              key: 'cor',              type: 'pct1'  },
  { label: '% PTE',            key: 'pte_pct',          type: 'pct'   },
  { label: 'Margen YTD',       key: 'margen_ytd',       type: 'euro'  },
]

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtInt(v: number | null): string {
  if (v == null) return '—'
  return Math.round(v).toLocaleString('es-ES')
}

function fmtEuro(v: number | null): string {
  if (v == null) return '—'
  return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(v: number | null): string {
  if (v == null) return '—'
  return (v * 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
}

function fmtPct1(v: number | null): string {
  if (v == null) return '—'
  return (v * 100).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}

function fmtCell(v: any, type: string): string {
  if (v == null || v === '') return '—'
  switch (type) {
    case 'int':   return fmtInt(v)
    case 'euro':  return fmtEuro(v)
    case 'pct':   return fmtPct(v)
    case 'pct1':  return fmtPct1(v)
    default:      return String(v)
  }
}

// ─── Badge component ──────────────────────────────────────────────────────────
function Badge({ v }: { v: any }) {
  if (v == null || v === '') return <span className="text-gray-400">—</span>
  const num = Number(v)
  const cls = num >= 0
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-red-50 text-red-700 border border-red-200'
  const sign = num > 0 ? '+' : ''
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${cls}`}>
      {sign}{(num * 100).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
    </span>
  )
}

// ─── Row helpers ──────────────────────────────────────────────────────────────
function isTotal(r: Row): boolean {
  // A row is a total/subtotal if ramo is null/empty/Total or lob === 'Total'
  return (
    r.lob === 'Total' ||
    r.ramo == null || r.ramo === '' || r.ramo === 'Total'
  )
}

function isSubtotal(r: Row): boolean {
  // LOB-level totals: lob is a valid section but ramo is empty/null
  return r.lob !== 'Total' && (r.ramo == null || r.ramo === '' || r.ramo === 'Total')
}

function lobPriority(lob: string): number {
  return LOB_ORDER[lob] ?? 99
}

// Sort No Vida rows: by LOB priority, then ramo, then subramo; totals last within group
function sortNoVida(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => {
    const lobA = lobPriority(a.lob)
    const lobB = lobPriority(b.lob)
    if (lobA !== lobB) return lobA - lobB
    // within same LOB: subtotals/totals last
    const aTotal = isSubtotal(a) || a.lob === 'Total'
    const bTotal = isSubtotal(b) || b.lob === 'Total'
    if (aTotal !== bTotal) return aTotal ? 1 : -1
    const ramoA = (a.ramo || '').toLowerCase()
    const ramoB = (b.ramo || '').toLowerCase()
    if (ramoA !== ramoB) return ramoA < ramoB ? -1 : 1
    const subA = (a.subramo || '').toLowerCase()
    const subB = (b.subramo || '').toLowerCase()
    return subA < subB ? -1 : subA > subB ? 1 : 0
  })
}

// ─── Table cell renderer ──────────────────────────────────────────────────────
function renderCell(
  col: { key: string; type: string },
  v: any,
  isTotalRow: boolean
) {
  if (col.type === 'badge') {
    return <Badge v={v} />
  }
  const text = fmtCell(v, col.type)
  const isNumeric = col.type !== 'text'
  const colorClass =
    col.key === 'net_inflow' && v != null
      ? Number(v) >= 0 ? 'text-emerald-700' : 'text-red-700'
      : col.key === 'cash_flow' && v != null
      ? Number(v) >= 0 ? 'text-emerald-700' : 'text-red-700'
      : ''
  return (
    <span className={`${isNumeric ? 'tabular-nums' : ''} ${colorClass}`}>
      {text}
    </span>
  )
}

// ─── LOB tabs ─────────────────────────────────────────────────────────────────
type LobTab = 'PARTICULARES' | 'EMPRESAS' | 'SALUD' | 'TOTAL_IARD' | 'VIDA'
const LOB_TABS: { key: LobTab; label: string }[] = [
  { key: 'PARTICULARES', label: 'Particulares' },
  { key: 'EMPRESAS',     label: 'Empresa'      },
  { key: 'SALUD',        label: 'Salud'        },
  { key: 'TOTAL_IARD',   label: 'Total IARD'   },
  { key: 'VIDA',         label: 'Vida'         },
]

// ─── Aggregate subramos → ramo level ─────────────────────────────────────────
const SUM_COLS = ['np','np_ant','pol','net_inflow','gwp','gwpa','gwpnp','gwpnpa',
  'primas_adq','sccy','sccy_ant','dif_sccy','sccy_leves','sccy_leves_ant',
  'dif_sccy_leves','importe_cor','margen_ytd']

function aggregateByRamo(rows: Row[], lob: string): Row[] {
  const lobRows = rows.filter(r => r.lob === lob && r.ramo !== 'Total' && r.ramo != null && r.ramo !== '')
  const totalRow = rows.find(r => r.lob === lob && r.ramo === 'Total')

  const byRamo = new Map<string, Row[]>()
  for (const r of lobRows) {
    const key = r.ramo || ''
    if (!byRamo.has(key)) byRamo.set(key, [])
    byRamo.get(key)!.push(r)
  }

  const result: Row[] = []
  for (const [, group] of byRamo.entries()) {
    if (group.length === 1) {
      result.push({ ...group[0], subramo: null })
    } else {
      const agg: Row = { ...group[0], subramo: null }
      for (const key of SUM_COLS) {
        const hasAny = group.some(r => r[key] != null)
        agg[key] = hasAny ? group.reduce((s, r) => s + (r[key] != null ? Number(r[key]) : 0), 0) : null
      }
      // pct/ratio cols can't be summed — clear them
      for (const k of Object.keys(agg)) {
        if (!SUM_COLS.includes(k) && !['lob','ramo','subramo','year','month','medor_code','medofis_code'].includes(k)) {
          agg[k] = null
        }
      }
      result.push(agg)
    }
  }

  result.sort((a, b) => (a.ramo || '').localeCompare(b.ramo || '', 'es'))
  if (totalRow) result.push(totalRow)
  return result
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ArgosPage() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(3)
  const [medofis, setMedofis] = useState('MEDOR')
  const [nvData, setNvData] = useState<Row[]>([])
  const [vData, setVData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [lob, setLob] = useState<LobTab>('PARTICULARES')

  useEffect(() => {
    setLoading(true)
    const base = `/api/argos?year=${year}&month=${month}&medor=742776`
    const medofisParam = medofis === 'MEDOR' ? 'TOTAL' : medofis
    Promise.all([
      fetch(`${base}&tipo=novida&medofis=${medofisParam}`).then(r => r.json()),
      fetch(`${base}&tipo=vida`).then(r => r.json()),
    ]).then(([nv, v]) => {
      setNvData(nv.data || [])
      setVData(v.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [year, month, medofis])

  // Aggregate rows for the selected LOB tab
  const displayNvRows: Row[] = (() => {
    if (lob === 'VIDA' || lob === 'TOTAL_IARD') return []
    return aggregateByRamo(nvData, lob)
  })()

  // Total IARD: one row per LOB total + grand total
  const totalIardRows: Row[] = (() => {
    if (lob !== 'TOTAL_IARD') return []
    const lobTotals = ['PARTICULARES', 'EMPRESAS', 'SALUD']
      .map(l => nvData.find(r => r.lob === l && r.ramo === 'Total'))
      .filter(Boolean) as Row[]
    const grandTotal = nvData.find(r => r.lob === 'Total' && (r.ramo == null || r.ramo === ''))
    return grandTotal ? [...lobTotals, grandTotal] : lobTotals
  })()

  // NV_COLS without Subramo for the aggregated view (col index 2)
  const NV_COLS_AGG = NV_COLS.filter(c => c.key !== 'subramo')

  // Sticky column count (LoB, Ramo — no Subramo in aggregated view)
  const STICKY = 2

  const stickyTh = (i: number) =>
    i < STICKY
      ? `sticky left-0 z-20 bg-[#003A8F] ${i === 0 ? 'left-0' : i === 1 ? 'left-[96px]' : 'left-[192px]'}`
      : ''

  // We'll use inline style for proper sticky offsets at runtime
  const stickyOffsets = [0, 96, 192]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ARGOS</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {MESES[month]} {year} · Datos reales AXA
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Año */}
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* Mes */}
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map(m => <option key={m} value={m}>{MESES[m]}</option>)}
          </select>
          {/* MEDOR / MEDOFIS */}
          <select
            value={medofis}
            onChange={e => setMedofis(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ALL_MEDOFIS.map(m => (
              <option key={m} value={m}>{m === 'MEDOR' ? 'MEDOR (total)' : `MEDOFIS ${m}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LOB tab switcher */}
      <div className="border-b border-slate-200 flex">
        {LOB_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setLob(t.key)}
            className={`px-6 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              lob === t.key
                ? 'border-[#003A8F] text-[#003A8F]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-20 text-center text-slate-400 text-sm">Cargando datos...</div>
      )}

      {/* ── NO VIDA ─────────────────────────────────────────────────────── */}
      {!loading && lob !== 'VIDA' && (() => {
        const rows = lob === 'TOTAL_IARD' ? totalIardRows : displayNvRows
        return (
        <div className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
            <table className="text-xs border-collapse" style={{ minWidth: 'max-content' }}>
              <thead>
                <tr className="bg-[#003A8F] text-white">
                  {NV_COLS_AGG.map((col, i) => {
                    const isSticky = i < STICKY
                    const isNumeric = col.type !== 'text'
                    return (
                      <th
                        key={col.key}
                        className={`py-2 px-3 text-xs font-semibold whitespace-nowrap border-r border-blue-700 ${
                          isNumeric ? 'text-right' : 'text-left'
                        } ${isSticky ? 'sticky z-30 bg-[#003A8F]' : ''}`}
                        style={isSticky ? { left: i === 0 ? 0 : 96 } : undefined}
                      >
                        {col.label}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={NV_COLS_AGG.length} className="text-center py-12 text-slate-400">
                      Sin datos
                    </td>
                  </tr>
                )}
                {rows.map((row, idx) => {
                  // En Total IARD: solo el gran total (lob='Total') va en negrita/gris
                  // Las filas de LOB (PARTICULARES/Total, etc.) van con fondo alternado
                  const isGrandTotal = row.lob === 'Total'
                  const isLobTotal = lob !== 'TOTAL_IARD' && isTotal(row)
                  const isBold = isGrandTotal || isLobTotal
                  const rowBg = isGrandTotal
                    ? 'bg-[#003A8F] text-white hover:bg-[#002d70]'
                    : isLobTotal
                    ? 'bg-slate-100 hover:bg-slate-200'
                    : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
                  const fontCls = isBold ? 'font-bold' : ''
                  return (
                    <tr key={idx} className={`border-b border-slate-100 ${rowBg} ${fontCls}`}>
                      {NV_COLS_AGG.map((col, i) => {
                        const isSticky = i < STICKY
                        const isNumeric = col.type !== 'text'
                        const stickyBg = isGrandTotal ? 'bg-[#003A8F]' : isLobTotal ? 'bg-slate-100' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'

                        return (
                          <td
                            key={col.key}
                            className={`py-1.5 px-3 whitespace-nowrap border-r border-slate-100 ${
                              isNumeric ? 'text-right' : 'text-left'
                            } ${isSticky ? `sticky z-10 ${stickyBg}` : ''} ${isGrandTotal ? 'text-white' : ''}`}
                            style={isSticky ? { left: i === 0 ? 0 : 96 } : undefined}
                          >
                            {renderCell(col, row[col.key], isBold)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        )
      })()}

      {/* ── VIDA ────────────────────────────────────────────────────────── */}
      {!loading && lob === 'VIDA' && (
        <div className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
            <table className="text-xs border-collapse" style={{ minWidth: 'max-content' }}>
              <thead>
                <tr className="bg-[#003A8F] text-white">
                  {V_COLS.map((col, i) => {
                    const isSticky = i < 2
                    const isNumeric = col.type !== 'text'
                    const vidaStickyOffsets = [0, 96]
                    return (
                      <th
                        key={col.key}
                        className={`py-2 px-3 text-xs font-semibold whitespace-nowrap border-r border-blue-700 ${
                          isNumeric ? 'text-right' : 'text-left'
                        } ${isSticky ? 'sticky z-30 bg-[#003A8F]' : ''}`}
                        style={isSticky ? { left: vidaStickyOffsets[i] } : undefined}
                      >
                        {col.label}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {vData.length === 0 && (
                  <tr>
                    <td colSpan={V_COLS.length} className="text-center py-12 text-slate-400">
                      Sin datos de Vida
                    </td>
                  </tr>
                )}
                {vData.map((row, idx) => {
                  const totalRow =
                    (row.negocio === 'Total' || row.negocio == null || row.negocio === '') &&
                    (row.lob === 'Total' || row.lob == null || row.lob === '')
                  const rowBg = totalRow
                    ? 'bg-slate-100 hover:bg-slate-200'
                    : 'bg-white hover:bg-slate-50'
                  const fontCls = totalRow ? 'font-bold' : ''
                  const vidaStickyOffsets = [0, 96]

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-slate-100 ${rowBg} ${fontCls}`}
                    >
                      {V_COLS.map((col, i) => {
                        const isSticky = i < 2
                        const isNumeric = col.type !== 'text'
                        const stickyBg = totalRow ? 'bg-slate-100' : 'bg-white'

                        return (
                          <td
                            key={col.key}
                            className={`py-1.5 px-3 whitespace-nowrap border-r border-slate-100 ${
                              isNumeric ? 'text-right' : 'text-left'
                            } ${isSticky ? `sticky z-10 ${stickyBg}` : ''}`}
                            style={isSticky ? { left: vidaStickyOffsets[i] } : undefined}
                          >
                            {renderCell(col, row[col.key], totalRow)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
