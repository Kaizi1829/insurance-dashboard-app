'use client'

import { useState, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
type Row = Record<string, any>

// ─── Constants ───────────────────────────────────────────────────────────────
const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ALL_MEDOFIS = ['MEDOR', '742776', '742826', '742821', '755224']

type Period = { year: number; month: number }

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
  return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function fmtPct(v: number | null): string {
  if (v == null) return '—'
  return (v * 100).toFixed(2) + '%'
}

function fmtPct1(v: number | null): string {
  if (v == null) return '—'
  return (v * 100).toFixed(1) + '%'
}

function fmtCell(v: any, type: string): string {
  if (v == null || v === '') return '—'
  const n = Number(v)
  // En tablas financieras, 0 en importes/enteros significa "sin actividad" → mostrar —
  if ((type === 'euro' || type === 'int') && n === 0) return '—'
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
  if (v == null || v === '') {
    return <span style={{ color: '#94a3b8' }}>—</span>
  }
  const num = Number(v)
  const sign = num > 0 ? '+' : ''
  const display = sign + (num * 100).toFixed(2) + '%'

  let style: React.CSSProperties
  if (num > 0) {
    style = {
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      background: '#ecfdf5',
      color: '#065f46',
      border: '1px solid #a7f3d0',
    }
  } else if (num < 0) {
    style = {
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    }
  } else {
    style = {
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      background: '#f8fafc',
      color: '#64748b',
      border: '1px solid #e2e8f0',
    }
  }

  return <span style={style}>{display}</span>
}

// ─── Row helpers ──────────────────────────────────────────────────────────────
function isTotal(r: Row): boolean {
  return (
    r.lob === 'Total' ||
    r.ramo == null || r.ramo === '' || r.ramo === 'Total'
  )
}

function isSubtotal(r: Row): boolean {
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
  const isNull = (v == null || v === '')
  const isNumeric = col.type !== 'text'

  let color: string | undefined
  if (isNull) {
    color = '#cbd5e1'
  } else if (col.key === 'net_inflow') {
    color = Number(v) >= 0 ? '#065f46' : '#991b1b'
  } else if (col.key === 'cash_flow') {
    color = Number(v) >= 0 ? '#065f46' : '#991b1b'
  }

  return (
    <span
      style={{
        fontVariantNumeric: isNumeric ? 'tabular-nums' : undefined,
        color: color,
      }}
    >
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
      // Usar el subramo dominante (mayor GWP) para las columnas de porcentaje
      const dominant = group.reduce((best, r) =>
        (Number(r.gwp) || 0) > (Number(best.gwp) || 0) ? r : best
      , group[0])

      // Empezar con los valores del subramo dominante (preserva los %)
      const agg: Row = { ...dominant, subramo: null }

      // Sumar las columnas absolutas de todos los subramos
      for (const key of SUM_COLS) {
        const hasAny = group.some(r => r[key] != null)
        agg[key] = hasAny ? group.reduce((s, r) => s + (r[key] != null ? Number(r[key]) : 0), 0) : null
      }
      result.push(agg)
    }
  }

  result.sort((a, b) => (a.ramo || '').localeCompare(b.ramo || '', 'es'))
  if (totalRow) result.push(totalRow)
  return result
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: '16px' }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <circle cx="16" cy="16" r="13" stroke="#e2e8f0" strokeWidth="3" />
        <path d="M16 3 a13 13 0 0 1 13 13" stroke="#003A8F" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span style={{ color: '#94a3b8', fontSize: '13px' }}>Cargando datos...</span>
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={999}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: '12px' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#f8fafc" />
            <path d="M12 20h16M20 12v16" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{message}</span>
        </div>
      </td>
    </tr>
  )
}

// ─── Reusable data table ──────────────────────────────────────────────────────
interface DataTableProps {
  cols: typeof NV_COLS
  rows: Row[]
  stickyCount: number
  stickyColWidths: number[]   // px width per sticky column
  isTotalRow: (row: Row) => boolean
  emptyMessage: string
}

function DataTable({ cols, rows, stickyCount, stickyColWidths, isTotalRow, emptyMessage }: DataTableProps) {
  // Compute left offset for each sticky column
  const stickyLeft: number[] = []
  let acc = 0
  for (let i = 0; i < stickyCount; i++) {
    stickyLeft.push(acc)
    acc += stickyColWidths[i] ?? 96
  }

  // Colors
  const HEADER_BG = '#003A8F'
  const HEADER_TEXT = '#ffffff'
  const HEADER_BORDER = 'rgba(255,255,255,0.15)'
  const ROW_BG_REGULAR = '#ffffff'
  const ROW_BG_TOTAL = '#f1f5f9'
  const ROW_HOVER_REGULAR = '#eff6ff'
  const ROW_HOVER_TOTAL = '#e2e8f0'
  const ROW_BORDER = '#e2e8f0'
  const STICKY_SEPARATOR = '2px solid #cbd5e1'

  return (
    // CRITICAL: border-separate so sticky works in Chrome; border-spacing:0 so no gaps
    <table
      style={{
        borderCollapse: 'separate',
        borderSpacing: 0,
        minWidth: 'max-content',
        width: '100%',
        fontSize: '12px',
        tableLayout: 'auto',
      }}
    >
      <thead>
        <tr>
          {cols.map((col, i) => {
            const isSticky = i < stickyCount
            const isLastSticky = i === stickyCount - 1
            const isNumeric = col.type !== 'text'
            return (
              <th
                key={col.key}
                style={{
                  position: 'sticky',
                  top: 0,
                  left: isSticky ? stickyLeft[i] : undefined,
                  zIndex: isSticky ? 50 : 40,
                  backgroundColor: HEADER_BG,
                  color: HEADER_TEXT,
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  padding: '10px 12px',
                  textAlign: isNumeric ? 'right' : 'left',
                  borderRight: isLastSticky ? STICKY_SEPARATOR : `1px solid ${HEADER_BORDER}`,
                  borderBottom: `2px solid rgba(255,255,255,0.2)`,
                  boxShadow: isLastSticky ? '4px 0 8px rgba(0,0,0,0.08)' : undefined,
                  // minWidth ensures sticky offset is always correct regardless of content length
                  minWidth: isSticky ? stickyColWidths[i] : undefined,
                }}
              >
                {col.label}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          rows.map((row, idx) => {
            const total = isTotalRow(row)
            const baseBg = total ? ROW_BG_TOTAL : ROW_BG_REGULAR

            return (
              <tr
                key={idx}
                onMouseEnter={e => {
                  const target = e.currentTarget
                  const hoverBg = total ? ROW_HOVER_TOTAL : ROW_HOVER_REGULAR
                  Array.from(target.cells).forEach((cell, ci) => {
                    (cell as HTMLTableCellElement).style.backgroundColor = hoverBg
                  })
                }}
                onMouseLeave={e => {
                  const target = e.currentTarget
                  Array.from(target.cells).forEach((cell, ci) => {
                    const isSticky = ci < stickyCount
                    ;(cell as HTMLTableCellElement).style.backgroundColor = baseBg
                  })
                }}
              >
                {cols.map((col, i) => {
                  const isSticky = i < stickyCount
                  const isLastSticky = i === stickyCount - 1
                  const isNumeric = col.type !== 'text'

                  return (
                    <td
                      key={col.key}
                      style={{
                        // CRITICAL: always set explicit backgroundColor — never inherit from <tr>
                        backgroundColor: baseBg,
                        position: isSticky ? 'sticky' : undefined,
                        left: isSticky ? stickyLeft[i] : undefined,
                        zIndex: isSticky ? 20 : undefined,
                        padding: '7px 12px',
                        whiteSpace: 'nowrap',
                        textAlign: isNumeric ? 'right' : 'left',
                        color: total ? '#0f172a' : '#334155',
                        fontWeight: total ? 600 : 400,
                        height: '36px',
                        borderBottom: `1px solid ${ROW_BORDER}`,
                        borderRight: isLastSticky ? STICKY_SEPARATOR : '1px solid #f1f5f9',
                        boxShadow: isLastSticky ? '4px 0 8px rgba(0,0,0,0.05)' : undefined,
                        // minWidth ensures offset is always valid regardless of text length
                        minWidth: isSticky ? stickyColWidths[i] : undefined,
                      }}
                    >
                      {renderCell(col, row[col.key], total)}
                    </td>
                  )
                })}
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ArgosPage() {
  const [year, setYear] = useState(0)
  const [month, setMonth] = useState(0)
  const [medofis, setMedofis] = useState('MEDOR')
  const [nvData, setNvData] = useState<Row[]>([])
  const [vData, setVData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [lob, setLob] = useState<LobTab>('PARTICULARES')
  const [periods, setPeriods] = useState<Period[]>([])

  // Cargar períodos disponibles al montar
  useEffect(() => {
    fetch('/api/available-periods')
      .then(r => r.json())
      .then(data => {
        const available: Period[] = data.argos?.periods ?? []
        setPeriods(available)
        if (available.length > 0) {
          setYear(available[0].year)
          setMonth(available[0].month)
        }
      })
      .catch(() => {})
  }, [])

  // Cargar datos cuando cambia año, mes o medofis
  useEffect(() => {
    if (!year || !month) return
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

  // Años y meses disponibles (solo los que tienen datos)
  const availableYears = [...new Set(periods.map(p => p.year))].sort((a, b) => b - a)
  const availableMonths = periods
    .filter(p => p.year === year)
    .map(p => p.month)
    .sort((a, b) => b - a)

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

  // NV_COLS without Subramo for the aggregated view
  const NV_COLS_AGG = NV_COLS.filter(c => c.key !== 'subramo')

  // Sticky column widths (px) — must match actual rendered widths
  const NV_STICKY_WIDTHS = [80, 120]  // LoB, Ramo
  const V_STICKY_WIDTHS = [100, 100]  // Negocio, LoB

  // isTotalRow for No Vida
  const nvIsTotalRow = (row: Row): boolean => {
    const isGrandTotal = row.lob === 'Total'
    const isRegularTotal = lob !== 'TOTAL_IARD' && isTotal(row)
    return isGrandTotal || isRegularTotal
  }

  // isTotalRow for Vida
  const vIsTotalRow = (row: Row): boolean => {
    return row.lob === 'Total' || row.negocio === 'Total'
  }

  const selectStyle: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '13px',
    background: '#ffffff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '120px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0' }}>

      {/* ── Top controls ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: '1.2' }}>
            ARGOS
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', margin: '4px 0 0' }}>
            {MESES[month]} {year} &middot; Datos reales AXA
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {/* Año */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Año</label>
            <select value={year} onChange={e => {
              const y = Number(e.target.value)
              setYear(y)
              // Auto-select latest month for this year
              const firstMonth = periods.filter(p => p.year === y).sort((a,b) => b.month - a.month)[0]
              if (firstMonth) setMonth(firstMonth.month)
            }} style={selectStyle}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Mes — solo los disponibles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mes</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ ...selectStyle, minWidth: '130px' }}>
              {availableMonths.map(m => <option key={m} value={m}>{MESES[m]}</option>)}
            </select>
          </div>

          {/* MEDOR / MEDOFIS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mediador</label>
            <select value={medofis} onChange={e => setMedofis(e.target.value)} style={{ ...selectStyle, minWidth: '150px' }}>
              {ALL_MEDOFIS.map(m => (
                <option key={m} value={m}>{m === 'MEDOR' ? 'MEDOR (total)' : `MEDOFIS ${m}`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── LOB tab bar ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        {LOB_TABS.map(t => {
          const active = lob === t.key
          return (
            <button
              key={t.key}
              onClick={() => setLob(t.key)}
              style={{
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: active ? 600 : 500,
                color: active ? '#ffffff' : '#475569',
                background: active ? '#003A8F' : '#ffffff',
                border: active ? '1px solid #003A8F' : '1px solid #e2e8f0',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: 'none',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 1px 4px rgba(0,58,143,0.2)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#334155'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#64748b'
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          background: '#ffffff',
          overflow: 'hidden',
        }}>
          <LoadingState />
        </div>
      )}

      {/* ── NO VIDA table ─────────────────────────────────────────────────── */}
      {!loading && lob !== 'VIDA' && (
        <div style={{
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          background: '#ffffff',
        }}>
          {/* CRITICAL: scroll container is the direct parent of the table */}
          <div style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 280px)',
          }}>
            <DataTable
              cols={NV_COLS_AGG}
              rows={lob === 'TOTAL_IARD' ? totalIardRows : displayNvRows}
              stickyCount={2}
              stickyColWidths={NV_STICKY_WIDTHS}
              isTotalRow={nvIsTotalRow}
              emptyMessage="Sin datos para el período seleccionado"
            />
          </div>
        </div>
      )}

      {/* ── VIDA table ────────────────────────────────────────────────────── */}
      {!loading && lob === 'VIDA' && (
        <div style={{
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          background: '#ffffff',
        }}>
          {/* CRITICAL: scroll container is the direct parent of the table */}
          <div style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 280px)',
          }}>
            <DataTable
              cols={V_COLS}
              rows={vData}
              stickyCount={2}
              stickyColWidths={V_STICKY_WIDTHS}
              isTotalRow={vIsTotalRow}
              emptyMessage="Sin datos de Vida para el período seleccionado"
            />
          </div>
        </div>
      )}

    </div>
  )
}
