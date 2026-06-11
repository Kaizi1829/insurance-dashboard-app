'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Tipo = 'real' | 'prevision'

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029]

// ─── Estructura P&L ──────────────────────────────────────────────────────────
const INGRESOS_LINES = [
  { key: 'comisiones',    label: 'Comisiones' },
  { key: 'rapeles',       label: 'Rapeles' },
  { key: 'cofinanciados', label: 'Cofinanciados' },
  { key: 'alquileres',    label: 'Alquileres' },
  { key: 'otros',         label: 'Otros ingresos' },
]

const GASTOS_LINES = [
  { key: 'subagentes',     label: 'Comisiones Sub-Agentes / Colaboradores' },
  { key: 'personal',       label: 'Gastos de personal (sin titular)' },
  { key: 'incentivos',     label: 'Retribución variable / Incentivos equipo' },
  { key: 'externos',       label: 'Profesionales externos (gestoría, limpieza…)' },
  { key: 'marketing',      label: 'Gastos de marketing' },
  { key: 'alquiler',       label: 'Alquiler local y tributos' },
  { key: 'renting',        label: 'Renting vehículos comerciales' },
  { key: 'gestion',        label: 'Gastos de gestión (seguros, material oficina)' },
  { key: 'desplazamiento', label: 'Desplazamiento / viajes / representación' },
  { key: 'suministros',    label: 'Suministros (teléfono, luz, agua)' },
  { key: 'informatica',    label: 'Informática / Tecnología' },
  { key: 'ss_titular',     label: 'Seguridad Social Titular' },
  { key: 'varios',         label: 'Varios' },
]

const RAMOS_NEGOCIO = [
  { key: 'auto',      label: 'Auto',         comision: 10 },
  { key: 'hogar',     label: 'Hogar',        comision: 20 },
  { key: 'empresas',  label: 'Empresas',     comision: 20 },
  { key: 'salud',     label: 'Salud',        comision: 10 },
  { key: 'vida',      label: 'Vida Riesgo',  comision: 20 },
  { key: 'otros',     label: 'Otros',        comision: 20 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function n(v: any): number { return Number(v) || 0 }

function fmt(v: number, decimals = 0): string {
  if (!v && v !== 0) return '—'
  return v.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtEuro(v: number): string {
  if (!v) return '—'
  return fmt(v) + ' €'
}

function fmtPct(v: number): string {
  return fmt(v, 1) + '%'
}

function semaforo(ratio: number, type: 'beneficio' | 'solvencia' | 'comision' | 'productividad') {
  if (type === 'beneficio')    return ratio >= 5 ? '#16a34a' : ratio >= 0 ? '#f59e0b' : '#dc2626'
  if (type === 'solvencia')    return ratio >= 2 ? '#16a34a' : ratio >= 1 ? '#f59e0b' : '#dc2626'
  if (type === 'comision')     return ratio >= 12 && ratio <= 15 ? '#16a34a' : '#f59e0b'
  if (type === 'productividad') return ratio >= 500000 ? '#16a34a' : ratio >= 300000 ? '#f59e0b' : '#dc2626'
  return '#64748b'
}

// ─── Celda editable ───────────────────────────────────────────────────────────
function EditCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const confirm = () => {
    const val = n(raw.replace(/\./g, '').replace(',', '.'))
    onSave(val)
    setEditing(false)
  }

  const cancel = () => setEditing(false)

  if (editing) {
    return (
      <input
        ref={inputRef}
        style={{
          width: '100%', textAlign: 'right', border: '2px solid #003A8F',
          borderRadius: 6, padding: '3px 6px', fontSize: 12, outline: 'none',
          background: '#eff6ff', color: '#003A8F', fontWeight: 600,
        }}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={confirm}
        onKeyDown={e => {
          if (e.key === 'Enter')  { e.preventDefault(); confirm() }
          if (e.key === 'Escape') { e.preventDefault(); cancel()  }
        }}
      />
    )
  }

  return (
    <span
      title="Haz clic para editar"
      style={{ cursor: 'pointer', padding: '2px 4px', borderRadius: 4, display: 'inline-block', minWidth: 60, textAlign: 'right' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      onClick={() => { setRaw(value ? String(value) : ''); setEditing(true) }}
    >
      {value ? fmtEuro(value) : <span style={{ color: '#94a3b8' }}>— clic para editar</span>}
    </span>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ExplotacionPage() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(4)
  const [tipo, setTipo] = useState<Tipo>('real')
  const [tab, setTab] = useState<'pl' | 'mando' | 'ratios'>('pl')
  const [saving, setSaving] = useState(false)

  // Datos P&L
  const [ingresos, setIngresos] = useState<Record<string, number>>({})
  const [gastos, setGastos] = useState<Record<string, number>>({})
  // Datos negocio
  const [negocio, setNegocio] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    const [expRes, mandoRes] = await Promise.all([
      fetch(`/api/explotacion?year=${year}`),
      fetch(`/api/cuadro-mando?year=${year}`),
    ])
    const expData = await expRes.json()
    const mandoData = await mandoRes.json()

    const row = Array.isArray(expData)
      ? expData.find((r: any) => r.month === month && r.tipo === tipo)
      : null
    setIngresos(row?.ingresos ?? {})
    setGastos(row?.gastos ?? {})

    const mandoRow = Array.isArray(mandoData)
      ? mandoData.find((r: any) => r.month === month && r.tipo === tipo)
      : null
    setNegocio(mandoRow?.datos ?? {})
  }, [year, month, tipo])

  useEffect(() => { load() }, [load])

  const saveAll = async () => {
    setSaving(true)
    await Promise.all([
      fetch('/api/explotacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, tipo, ingresos, gastos }),
      }),
      fetch('/api/cuadro-mando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, tipo, datos: negocio }),
      }),
    ])
    setSaving(false)
  }

  // ─── Cálculos automáticos ────────────────────────────────────────────────
  const totalIngresos = INGRESOS_LINES.reduce((s, l) => s + n(ingresos[l.key]), 0)
  const totalGastos   = GASTOS_LINES.reduce((s, l) => s + n(gastos[l.key]), 0)
  const retribucion   = n(gastos['retribucion_propia'])
  const ingresoNeto   = totalIngresos - n(ingresos['otros']) - n(gastos['subagentes'])
  const resultExp     = totalIngresos - totalGastos
  const bai           = totalIngresos - totalGastos - retribucion
  const margenSolv    = n(ingresos['comisiones']) - totalGastos - retribucion
  const ratioResultExp = totalIngresos > 0 ? (resultExp / totalIngresos) * 100 : 0
  const ratioBai       = totalIngresos > 0 ? (bai / totalIngresos) * 100 : 0
  const ratioSolv      = totalGastos > 0 ? margenSolv / totalGastos : 0

  const totalPrimas = RAMOS_NEGOCIO.reduce((s, r) => s + n(negocio[`primas_${r.key}`]), 0)
  const comisionMedia = totalPrimas > 0
    ? RAMOS_NEGOCIO.reduce((s, r) => s + n(negocio[`primas_${r.key}`]) * r.comision / 100, 0) / totalPrimas * 100
    : 0
  const ftes = n(negocio['ftes']) || 1
  const productividadFte = totalPrimas / ftes
  const rentabilidadFte  = ingresoNeto / ftes

  // ─── Estilos comunes ──────────────────────────────────────────────────────
  const sectionHeader = { background: '#003A8F', color: '#fff', fontWeight: 700, fontSize: 12, padding: '8px 12px' }
  const totalRow      = { background: '#f1f5f9', fontWeight: 700 }
  const resultRow     = { background: '#003A8F', color: '#fff', fontWeight: 700 }

  const selectStyle: React.CSSProperties = {
    border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px',
    fontSize: 13, background: '#fff', color: '#334155', cursor: 'pointer',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', fontSize: 13, fontWeight: active ? 600 : 500,
    color: active ? '#fff' : '#475569', background: active ? '#003A8F' : '#fff',
    border: active ? '1px solid #003A8F' : '1px solid #e2e8f0',
    borderRadius: 9999, cursor: 'pointer', transition: 'all 0.15s',
    boxShadow: active ? '0 1px 4px rgba(0,58,143,0.2)' : '0 1px 2px rgba(0,0,0,0.04)',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Cuenta de Explotación</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{MESES[month]} {year} · {tipo === 'real' ? 'Datos reales' : 'Previsión'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={selectStyle}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ ...selectStyle, minWidth: 120 }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{MESES[m]}</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value as Tipo)} style={selectStyle}>
            <option value="real">Real</option>
            <option value="prevision">Previsión</option>
          </select>
          <button
            onClick={saveAll}
            disabled={saving}
            style={{ padding: '8px 20px', background: saving ? '#94a3b8' : '#003A8F', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {saving ? 'Guardando…' : '💾 Guardar'}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={tabStyle(tab === 'pl')}     onClick={() => setTab('pl')}>P&amp;L — Cuenta Explotación</button>
        <button style={tabStyle(tab === 'mando')}  onClick={() => setTab('mando')}>Cuadro de Mando Negocio</button>
        <button style={tabStyle(tab === 'ratios')} onClick={() => setTab('ratios')}>Ratios Financieros</button>
      </div>

      {/* ── TAB: P&L ──────────────────────────────────────────────────────── */}
      {tab === 'pl' && (
        <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...sectionHeader, textAlign: 'left', width: '60%' }}>Concepto</th>
                <th style={{ ...sectionHeader, textAlign: 'right' }}>Importe</th>
              </tr>
            </thead>
            <tbody>

              {/* INGRESOS */}
              <tr><td colSpan={2} style={{ background: '#eff6ff', color: '#1e40af', fontWeight: 700, fontSize: 11, padding: '6px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingresos Brutos</td></tr>
              {INGRESOS_LINES.map(l => (
                <tr key={l.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px 8px 24px', color: '#334155' }}>{l.label}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <EditCell value={n(ingresos[l.key])} onSave={v => setIngresos(prev => ({ ...prev, [l.key]: v }))} />
                  </td>
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>TOTAL INGRESOS BRUTOS</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{fmtEuro(totalIngresos)}</td>
              </tr>

              {/* GASTOS */}
              <tr><td colSpan={2} style={{ background: '#fef2f2', color: '#991b1b', fontWeight: 700, fontSize: 11, padding: '6px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gastos de Explotación</td></tr>
              {GASTOS_LINES.map(l => (
                <tr key={l.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px 8px 24px', color: '#334155' }}>{l.label}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <EditCell value={n(gastos[l.key])} onSave={v => setGastos(prev => ({ ...prev, [l.key]: v }))} />
                  </td>
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>TOTAL GASTOS EXPLOTACIÓN</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmtEuro(totalGastos)}</td>
              </tr>

              {/* Retribución propia */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 12px 8px 24px', color: '#334155' }}>Retribución propia (Socio / Propietario)</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  <EditCell value={n(gastos['retribucion_propia'])} onSave={v => setGastos(prev => ({ ...prev, retribucion_propia: v }))} />
                </td>
              </tr>
              <tr style={totalRow}>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>GASTOS TOTALES</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmtEuro(totalGastos + retribucion)}</td>
              </tr>

              {/* RESULTADOS */}
              <tr><td colSpan={2} style={{ background: '#f0fdf4', color: '#166534', fontWeight: 700, fontSize: 11, padding: '6px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resultados</td></tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: resultExp >= 0 ? '#f0fdf4' : '#fef2f2' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: resultExp >= 0 ? '#166534' : '#991b1b' }}>Resultado de Explotación</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: resultExp >= 0 ? '#166534' : '#991b1b' }}>
                  {fmtEuro(resultExp)} <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.8 }}>({fmtPct(ratioResultExp)})</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: bai >= 0 ? '#f0fdf4' : '#fef2f2' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: bai >= 0 ? '#166534' : '#991b1b' }}>Beneficio Corriente (BAI)</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: bai >= 0 ? '#166534' : '#991b1b' }}>
                  {fmtEuro(bai)} <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.8 }}>({fmtPct(ratioBai)})</span>
                </td>
              </tr>
              <tr style={{ background: margenSolv >= 0 ? '#f0fdf4' : '#fef2f2' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: margenSolv >= 0 ? '#166534' : '#991b1b' }}>Margen de Solvencia</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: margenSolv >= 0 ? '#166534' : '#991b1b' }}>
                  {fmtEuro(margenSolv)} <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.8 }}>(ratio: {fmt(ratioSolv, 2)}x)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: CUADRO DE MANDO ─────────────────────────────────────────── */}
      {tab === 'mando' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* KPIs generales */}
          <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ ...sectionHeader }}>KPIs Generales</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {[
                { key: 'ftes',     label: 'FTEs' },
                { key: 'polizas',  label: 'Nº Pólizas' },
                { key: 'clientes', label: 'Nº Clientes' },
              ].map(f => (
                <div key={f.key} style={{ padding: 16, borderRight: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>{f.label}</p>
                  <EditCell value={n(negocio[f.key])} onSave={v => setNegocio(prev => ({ ...prev, [f.key]: v }))} />
                </div>
              ))}
              <div style={{ padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Total Primas</p>
                <span style={{ fontWeight: 700, color: '#003A8F' }}>{fmtEuro(totalPrimas)}</span>
              </div>
            </div>
          </div>

          {/* Primas por ramo */}
          <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ ...sectionHeader }}>Primas por Ramo</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Ramo</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Primas</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>% Comisión</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Comisión est.</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>% s/Total</th>
                </tr>
              </thead>
              <tbody>
                {RAMOS_NEGOCIO.map(r => {
                  const primas = n(negocio[`primas_${r.key}`])
                  const comEst = primas * r.comision / 100
                  const pct = totalPrimas > 0 ? primas / totalPrimas * 100 : 0
                  return (
                    <tr key={r.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px' }}>{r.label}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <EditCell value={primas} onSave={v => setNegocio(prev => ({ ...prev, [`primas_${r.key}`]: v }))} />
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>{r.comision}%</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{comEst ? fmtEuro(comEst) : '—'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>{primas ? fmtPct(pct) : '—'}</td>
                    </tr>
                  )
                })}
                <tr style={totalRow}>
                  <td style={{ padding: '8px 12px' }}>TOTAL</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmtEuro(totalPrimas)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>{fmtPct(comisionMedia)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmtEuro(RAMOS_NEGOCIO.reduce((s, r) => s + n(negocio[`primas_${r.key}`]) * r.comision / 100, 0))}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Indicadores negocio */}
          <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ ...sectionHeader }}>Indicadores de Negocio</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
              {[
                { key: 'siniestralidad',    label: 'Siniestralidad (%)', suffix: '%' },
                { key: 'tasa_caida',        label: 'Tasa Caída (%)', suffix: '%' },
                { key: 'tasa_renovacion',   label: 'Tasa Renovación (%)', suffix: '%' },
                { key: 'tasa_np',           label: 'Tasa NP (%)', suffix: '%' },
              ].map(f => (
                <div key={f.key} style={{ padding: '12px 16px', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>{f.label}</p>
                  <EditCell value={n(negocio[f.key])} onSave={v => setNegocio(prev => ({ ...prev, [f.key]: v }))} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: RATIOS ───────────────────────────────────────────────────── */}
      {tab === 'ratios' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          {/* Ratios financieros */}
          {[
            {
              label: 'Resultado de Explotación',
              value: fmtEuro(resultExp),
              ratio: ratioResultExp,
              ratioLabel: fmtPct(ratioResultExp),
              type: 'beneficio' as const,
              target: 'Objetivo: 5–20%',
            },
            {
              label: 'Beneficio Corriente (BAI)',
              value: fmtEuro(bai),
              ratio: ratioBai,
              ratioLabel: fmtPct(ratioBai),
              type: 'beneficio' as const,
              target: 'Objetivo: 5–20%',
            },
            {
              label: 'Margen de Solvencia',
              value: fmtEuro(margenSolv),
              ratio: ratioSolv,
              ratioLabel: `${fmt(ratioSolv, 2)}x`,
              type: 'solvencia' as const,
              target: 'Objetivo: > 2x',
            },
            {
              label: 'Comisión Media',
              value: '',
              ratio: comisionMedia,
              ratioLabel: fmtPct(comisionMedia),
              type: 'comision' as const,
              target: 'Objetivo: 12–15%',
            },
            {
              label: 'Productividad FTE / Primas',
              value: '',
              ratio: productividadFte,
              ratioLabel: fmtEuro(productividadFte),
              type: 'productividad' as const,
              target: 'Objetivo: > 500.000 €',
            },
            {
              label: 'Rentabilidad FTE / Ingresos Netos',
              value: '',
              ratio: rentabilidadFte,
              ratioLabel: fmtEuro(rentabilidadFte),
              type: 'productividad' as const,
              target: 'Objetivo: > 60.000 €',
            },
          ].map(r => {
            const color = semaforo(r.ratio, r.type)
            return (
              <div key={r.label} style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>{r.label}</p>
                {r.value && <p style={{ fontSize: 14, color: '#334155', marginBottom: 4 }}>{r.value}</p>}
                <p style={{ fontSize: 28, fontWeight: 700, color, margin: '8px 0 4px' }}>{r.ratioLabel}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>{r.target}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
