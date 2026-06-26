"use client"

import { useEffect, useMemo, useState } from "react"
import {
  RAPEL_TABLAS_2026,
  CONDICIONES_2026,
  calcDevengoBloqueA,
  factorTNP,
  type TramoRapel,
} from "@/lib/objetivos"
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus, AlertCircle, Award, Trophy, ChevronDown, ChevronUp } from "lucide-react"

// ─── Helpers ───────────────────────────────────────────────────────────────────
const toN = (v: any) => (v === null || v === undefined || isNaN(Number(v)) ? 0 : Number(v))
const fmtE = (v: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v)
const fmtPct = (v: number, d = 1) => `${v >= 0 ? "+" : ""}${v.toFixed(d)}%`
const fmtPctAbs = (v: number, d = 1) => `${v.toFixed(d)}%`
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const LOB_LABELS: Record<string, string> = {
  salud: "Salud Individual", psc: "PSC",
  empresa: "Empresas", particulares: "Particulares",
  ahorro: "Ahorro", vida: "Vida Riesgo",
}

// ─── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchProduction(year: number, month: number) {
  const res = await fetch(`/api/production?year=${year}&month=${month}&medor=742776&medofis=TOTAL`)
  if (!res.ok) return { nv: [], vida: [] }
  return res.json()
}

// ─── Extractores de datos ──────────────────────────────────────────────────────
const lobGwp    = (nv: any[], lob: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.ramo === "Total" && !r.subramo)?.gwp)
const lobGwpA   = (nv: any[], lob: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.ramo === "Total" && !r.subramo)?.gwpa)
const lobGwpPct = (nv: any[], lob: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.ramo === "Total" && !r.subramo)?.gwp_pct) * 100
const lobGwpnp  = (nv: any[], lob: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.ramo === "Total" && !r.subramo)?.gwpnp)
const subGwp    = (nv: any[], lob: string, sub: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.subramo?.toUpperCase() === sub)?.gwp)
const subGwpA   = (nv: any[], lob: string, sub: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.subramo?.toUpperCase() === sub)?.gwpa)
const subGwpPct = (nv: any[], lob: string, sub: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.subramo?.toUpperCase() === sub)?.gwp_pct) * 100
const subGwpnp  = (nv: any[], lob: string, sub: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.subramo?.toUpperCase() === sub)?.gwpnp)
const vidaRiesgoNP = (vida: any[]) => vida.filter(r => r.lob === "Pure Protection").reduce((s, r) => s + toN(r.gwpnp), 0)
const pscGwp    = (nv: any[], vida: any[]) =>
  subGwp(nv, "SALUD", "SALUDCOL") + vida.filter(r => r.negocio === "Colectivo").reduce((s, r) => s + toN(r.gwp), 0)
const pscGwpA   = (nv: any[], vida: any[]) =>
  subGwpA(nv, "SALUD", "SALUDCOL") + vida.filter(r => r.negocio === "Colectivo").reduce((s, r) => s + toN(r.gwpa), 0)
const crec = (act: number, ant: number) => ant > 0 ? ((act - ant) / ant) * 100 : 0

// ─── Sección wrapper ───────────────────────────────────────────────────────────
function Section({ number, title, subtitle, children, accent = "#003A8F", collapsible = false, defaultOpen = true }: {
  number: string; title: string; subtitle?: string; children: React.ReactNode; accent?: string
  collapsible?: boolean; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
      <div
        className={`px-6 py-4 border-b border-slate-100 flex items-start gap-4 ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5"
          style={{ backgroundColor: accent }}>
          {number}
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {collapsible && (
          <div className="flex-shrink-0 mt-1 text-slate-400">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </div>
      {open && <div className="p-5">{children}</div>}
    </section>
  )
}

// ─── Fila de condición ─────────────────────────────────────────────────────────
function FilaCondicion({ label, valor, objetivo, ok, esEuros = false }: {
  label: string; valor: number; objetivo: string; ok: boolean; esEuros?: boolean
}) {
  return (
    <div className={`grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
      ok ? "border-emerald-100 bg-emerald-50/40" : "border-red-100 bg-red-50/30"
    }`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={`text-sm font-bold text-right ${ok ? "text-emerald-700" : "text-red-600"}`}>
        {esEuros ? fmtE(valor) : fmtPctAbs(valor)}
      </span>
      <span className="text-xs text-slate-400 text-right">{objetivo}</span>
      {ok
        ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
        : <XCircle     size={18} className="text-red-400 flex-shrink-0" />
      }
    </div>
  )
}

// ─── Bloque GWP crecimiento ────────────────────────────────────────────────────
function BloqueGwp({ label, gwpAct, gwpAnt, crecPct, tabla, condOk }: {
  label: string; gwpAct: number; gwpAnt: number; crecPct: number; tabla: TramoRapel[]; condOk: boolean
}) {
  const sinDato = gwpAnt === 0
  const { tramo, devengo } = condOk && !sinDato
    ? calcDevengoBloqueA(gwpAct, crecPct, tabla)
    : { tramo: null as any, devengo: 0 }
  const tramoIdx = tramo ? tabla.indexOf(tramo) : -1
  const color = crecPct > 0 ? "text-emerald-600" : crecPct < 0 ? "text-red-500" : "text-slate-400"

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        {sinDato
          ? <span className="text-xs text-slate-400">Sin dato anterior</span>
          : <span className={`text-sm font-bold flex items-center gap-1 ${color}`}>
              {crecPct > 0 ? <TrendingUp size={13}/> : crecPct < 0 ? <TrendingDown size={13}/> : <Minus size={13}/>}
              {fmtPct(crecPct)}
            </span>
        }
      </div>
      <div className="px-4 py-2 flex gap-6 text-xs">
        <div>
          <div className="text-slate-400">GWP año anterior</div>
          <div className="font-semibold text-slate-600">{sinDato ? "—" : fmtE(gwpAnt)}</div>
        </div>
        <div>
          <div className="text-slate-400">GWP año actual</div>
          <div className="font-semibold text-slate-800">{fmtE(gwpAct)}</div>
        </div>
      </div>
      <div className="px-3 pb-3 flex gap-1">
        {tabla.map((t, i) => {
          const isActive = i === tramoIdx
          const isPast   = i < tramoIdx
          return (
            <div key={i} className={`flex-1 rounded-lg px-1 py-1.5 text-center text-[10px] transition-all ${
              isActive ? "bg-[#003A8F] text-white font-bold shadow-sm"
              : isPast  ? "bg-emerald-100 text-emerald-700 font-medium"
              : "bg-white border border-slate-200 text-slate-400"
            }`}>
              <div className="font-semibold">≥{t.min}%</div>
              <div className={isActive ? "text-blue-200 text-[9px]" : "text-[9px]"}>{t.pct}%</div>
            </div>
          )
        })}
      </div>
      <div className={`px-4 py-2.5 text-xs flex items-center justify-between border-t ${
        devengo > 0 ? "border-emerald-100 bg-emerald-50" : "border-slate-100 bg-white"
      }`}>
        <span className="text-slate-400">Aportación estimada</span>
        <span className={`font-bold text-sm ${devengo > 0 ? "text-emerald-700" : "text-slate-400"}`}>
          {devengo > 0 ? fmtE(devengo) : "—"}
        </span>
      </div>
    </div>
  )
}

// ─── Barra de progreso ─────────────────────────────────────────────────────────
function ProgressBar({ label, actual, objetivo }: { label: string; actual: number; objetivo: number }) {
  const pct = objetivo > 0 ? Math.min((actual / objetivo) * 100, 100) : 0
  const ok  = actual >= objetivo && objetivo > 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={`font-semibold ${ok ? "text-emerald-600" : "text-slate-600"}`}>
          {fmtE(actual)} <span className="text-slate-400 font-normal">/ {fmtE(objetivo)}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${ok ? "bg-emerald-500" : "bg-[#003A8F]"}`}
          style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-right text-slate-400">{pct.toFixed(0)}% del objetivo</div>
    </div>
  )
}

// ─── Tarjeta de grado ──────────────────────────────────────────────────────────
function GradoCard({ titulo, items, icon: Icon }: {
  titulo: string
  items: { label: string; actual: number; objetivo: number }[]
  icon?: any
}) {
  const allOk = items.every(i => i.actual >= i.objetivo && i.objetivo > 0)
  const anyProgress = items.some(i => i.actual > 0)
  const IconComp = Icon ?? Award

  return (
    <div className={`rounded-2xl overflow-hidden border-2 transition-all ${
      allOk ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white"
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between gap-3 ${
        allOk ? "bg-emerald-500" : "bg-slate-50 border-b border-slate-100"
      }`}>
        <div className="flex items-center gap-3">
          <IconComp size={20} className={allOk ? "text-white" : "text-slate-400"} />
          <span className={`font-semibold text-sm ${allOk ? "text-white" : "text-slate-700"}`}>
            {titulo}
          </span>
        </div>
        {allOk
          ? <span className="text-xs font-bold bg-white text-emerald-700 px-2.5 py-1 rounded-full">✓ Conseguido</span>
          : anyProgress
            ? <span className="text-xs font-medium bg-white text-slate-500 px-2.5 py-1 rounded-full border border-slate-200">En curso</span>
            : <span className="text-xs text-slate-400">Sin datos</span>
        }
      </div>
      {/* Items */}
      <div className="px-5 py-4 space-y-4">
        {items.map((item, i) => {
          const pct   = item.objetivo > 0 ? Math.min((item.actual / item.objetivo) * 100, 100) : 0
          const ok    = item.actual >= item.objetivo && item.objetivo > 0
          const falta = item.objetivo - item.actual
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{item.label}</span>
                <span className={`font-bold ${ok ? "text-emerald-600" : "text-slate-700"}`}>
                  {fmtE(item.actual)}
                  <span className="text-slate-400 font-normal"> / {fmtE(item.objetivo)}</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${ok ? "bg-emerald-500" : "bg-[#003A8F]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{pct.toFixed(0)}% del objetivo</span>
                {!ok && item.objetivo > 0 && (
                  <span>Faltan {fmtE(falta)}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────────
export default function ObjetivosPage() {
  const [year,    setYear]    = useState(2026)
  const [month,   setMonth]   = useState(0)         // 0 = auto
  const [availableMonths, setAvailableMonths] = useState<number[]>([])
  const [prod,    setProd]    = useState<{ nv: any[]; vida: any[] }>({ nv: [], vida: [] })
  const [objetivos, setObjetivos] = useState<any>(null)
  const [loading,   setLoading]   = useState(true)

  // Auto-detect latest available month on first load
  useEffect(() => {
    fetch("/api/available-periods")
      .then(r => r.json())
      .then(p => {
        if (p?.production?.months) setAvailableMonths(p.production.months)
        if (month === 0 && p?.production?.latest?.month) setMonth(p.production.latest.month)
      })
      .catch(() => setMonth(m => m || 5))
  }, [])

  const effectiveMonth = month || availableMonths[availableMonths.length - 1] || 5

  useEffect(() => {
    if (!effectiveMonth) return
    setLoading(true)
    Promise.all([
      fetchProduction(year, effectiveMonth),
      fetch(`/api/objetivos?year=${year}`).then(r => r.json()),
    ]).then(([p, obj]) => {
      setProd(p); setObjetivos(obj)
    }).finally(() => setLoading(false))
  }, [year, effectiveMonth])

  // ── Fila Total IARD (crecimiento, TNP, pendiente, CoR) ────────────────────
  const totalRow  = prod.nv.find((r: any) => r.lob === "Total" && !r.ramo && !r.subramo)
  const crecIARD  = toN(totalRow?.gwp_pct) * 100
  const tnp       = toN(totalRow?.tasa_np_pct) * 100
  const pendiente = toN(totalRow?.pte_p_adq_pct) * 100
  const cor       = toN(totalRow?.cor)

  // ── Condiciones del contrato ──────────────────────────────────────────────
  const saludNP = lobGwpnp(prod.nv, "SALUD")
  const vidaRNP = vidaRiesgoNP(prod.vida)

  const condOk = useMemo(() => ({
    crecimiento: crecIARD  > CONDICIONES_2026.crecimientoIARDMin,
    cor:         cor       < CONDICIONES_2026.corMax,
    pendiente:   pendiente < CONDICIONES_2026.pendienteMax,
    vida:        vidaRNP   >= CONDICIONES_2026.vidaRiesgoMin,
    salud:       saludNP   >= CONDICIONES_2026.saludMin,
  }), [crecIARD, cor, pendiente, vidaRNP, saludNP])

  const todasOk  = Object.values(condOk).every(Boolean)
  const tnpFact  = factorTNP(tnp)

  // ── GWP por bloque (Rapel A) — gwp_pct = crecimiento directo del ARGOS ──────
  const gwpSaludInd    = subGwp (prod.nv, "SALUD", "SALUDIND")
  const gwpSaludIndAnt = subGwpA(prod.nv, "SALUD", "SALUDIND")
  const crecSaludInd   = subGwpPct(prod.nv, "SALUD", "SALUDIND")
  const gwpPart        = lobGwp (prod.nv, "PARTICULARES")
  const gwpPartAnt     = lobGwpA(prod.nv, "PARTICULARES")
  const crecPart       = lobGwpPct(prod.nv, "PARTICULARES")
  const gwpEmp         = lobGwp (prod.nv, "EMPRESAS")
  const gwpEmpAnt      = lobGwpA(prod.nv, "EMPRESAS")
  const crecEmp        = lobGwpPct(prod.nv, "EMPRESAS")
  const gwpPsc         = pscGwp (prod.nv, prod.vida)
  const gwpPscAnt      = pscGwpA(prod.nv, prod.vida)
  const crecPsc        = gwpPscAnt > 0 ? crec(gwpPsc, gwpPscAnt) : 0

  // ── Cálculo del rapel A ───────────────────────────────────────────────────
  const devengos = useMemo(() => {
    const r1 = calcDevengoBloqueA(gwpSaludInd, crecSaludInd, RAPEL_TABLAS_2026.saludInd)
    const r2 = calcDevengoBloqueA(gwpPart,     crecPart,     RAPEL_TABLAS_2026.particulares)
    const r3 = calcDevengoBloqueA(gwpEmp,      crecEmp,      RAPEL_TABLAS_2026.empresas)
    const r4 = calcDevengoBloqueA(gwpPsc,      crecPsc,      RAPEL_TABLAS_2026.psc)
    const crecTotal = r1.devengo + r2.devengo + r3.devengo + r4.devengo
    const potencial = r1.devengoPotencial + r2.devengoPotencial + r3.devengoPotencial + r4.devengoPotencial
    const nuevaProd = potencial * 0.30 * tnpFact
    return {
      crecimiento: crecTotal,
      nuevaProd,
      total: Math.min(crecTotal + nuevaProd, CONDICIONES_2026.devengMax),
    }
  }, [tnpFact, gwpSaludInd, crecSaludInd, gwpPart, crecPart, gwpEmp, crecEmp, gwpPsc, crecPsc])

  // ── GWPNP cuatrimestral ───────────────────────────────────────────────────
  const q = effectiveMonth <= 4 ? 1 : effectiveMonth <= 8 ? 2 : 3
  const objQ = objetivos?.rapelCuatrimestral?.[String(q)] ?? {}
  const gwpnpBloque: Record<string, number> = {
    salud:        subGwpnp(prod.nv, "SALUD", "SALUDIND"),
    psc:          subGwpnp(prod.nv, "SALUD", "SALUDCOL") +
                    prod.vida.filter(r => r.negocio === "Colectivo").reduce((s, r) => s + toN(r.gwpnp), 0),
    empresa:      lobGwpnp(prod.nv, "EMPRESAS"),
    particulares: lobGwpnp(prod.nv, "PARTICULARES"),
    ahorro:       prod.vida.filter(r => r.negocio === "Individual" && r.lob !== "Pure Protection")
                    .reduce((s, r) => s + toN(r.gwpnp ?? r.gwp), 0),
    vida:         vidaRiesgoNP(prod.vida),
  }

  // ── Grados (GWPNP) ───────────────────────────────────────────────────────
  const grados = objetivos?.grados ?? {}
  const gwpnpEmpresa  = lobGwpnp(prod.nv, "EMPRESAS")
  const gwpnpSaludInd = subGwpnp(prod.nv, "SALUD", "SALUDIND")
  const gwpnpPsc      = subGwpnp(prod.nv, "SALUD", "SALUDCOL") +
    prod.vida.filter(r => r.negocio === "Colectivo").reduce((s, r) => s + toN(r.gwpnp), 0)
  const gwpnpVidaInd  = prod.vida.filter(r => r.lob === "Pure Protection" && r.negocio === "Individual")
    .reduce((s, r) => s + toN(r.gwpnp), 0)
  const gwpnpAhorro   = prod.vida.filter(r => ["General Account", "Unit Linked", "Protection w/s"].includes(r.lob))
    .reduce((s, r) => s + toN(r.gwpnp ?? r.gwp), 0)

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Objetivos {year}</h1>
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-400">Cargando…</div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Objetivos {year}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Agencia 742776 · acumulado hasta {MESES[effectiveMonth - 1]} {year}
          </p>
        </div>
        <div className="flex gap-3">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none">
            {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
          </select>
          <select value={effectiveMonth} onChange={e => setMonth(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none">
            {(availableMonths.length > 0 ? availableMonths : [1,2,3,4,5]).map(m =>
              <option key={m} value={m}>{MESES[m - 1]}</option>
            )}
          </select>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          1 — RAPEL ANUAL
      ══════════════════════════════════════════════ */}
      <Section number="1" title="Rapel Anual"
        subtitle="Combinación de crecimiento de cartera (70%) + nueva producción (30%) · liquidación al cierre del año"
        collapsible>

        {/* Resumen en grande */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden mb-5">
          <div className="px-5 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Rapel estimado · si cerráramos hoy</div>
              <div className="text-xs text-slate-400">Requiere cumplir las 5 condiciones</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-900">{fmtE(devengos.total)}</div>
              <div className="text-xs text-slate-400 mt-1">
                {devengos.total >= CONDICIONES_2026.devengMax
                  ? "⚠ Tope máximo (125.000€)"
                  : `Faltan ${fmtE(CONDICIONES_2026.devengMax - devengos.total)} para el máximo`}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 grid grid-cols-2 divide-x divide-slate-200 bg-white">
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-slate-500 text-xs">Crecimiento GWP (70%)</span>
              <span className="font-semibold text-slate-800 text-sm">{fmtE(devengos.crecimiento)}</span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-slate-500 text-xs">Nueva Producción (30%)</span>
              <span className="font-semibold text-slate-800 text-sm">{fmtE(devengos.nuevaProd)}</span>
            </div>
          </div>
        </div>

        {/* Condiciones */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Condiciones para cobrar</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              todasOk ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              {todasOk ? "✓ Todas cumplidas" : "⚠ Pendientes"}
            </span>
          </div>
          <div className="space-y-2">
            <FilaCondicion label="Crecimiento GWP IARD"  valor={crecIARD}  objetivo="> 0%"                              ok={condOk.crecimiento} />
            <FilaCondicion label="CoR (rentabilidad)"    valor={cor}        objetivo="< 100%"                            ok={condOk.cor} />
            <FilaCondicion label="Pendiente de cobro"    valor={pendiente}  objetivo="< 2%"                              ok={condOk.pendiente} />
            <FilaCondicion label="Vida Riesgo NP"        valor={vidaRNP}    objetivo={`≥ ${fmtE(CONDICIONES_2026.vidaRiesgoMin)}`} ok={condOk.vida}  esEuros />
            <FilaCondicion label="Salud NP"              valor={saludNP}    objetivo={`≥ ${fmtE(CONDICIONES_2026.saludMin)}`}      ok={condOk.salud} esEuros />
          </div>
          {!todasOk && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex gap-2 text-xs text-amber-800">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              Mientras haya condiciones sin cumplir el cálculo de arriba es el potencial. El rapel real sería 0€.
            </div>
          )}
        </div>

        {/* Calculadora por segmento */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Calculadora de devengo por segmento
            <span className="ml-2 text-xs font-normal text-slate-400">GWP actual vs anterior · tramos del contrato</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <BloqueGwp label="Salud Individual" gwpAct={gwpSaludInd} gwpAnt={gwpSaludIndAnt} crecPct={crecSaludInd} tabla={RAPEL_TABLAS_2026.saludInd}    condOk={true} />
            <BloqueGwp label="Particulares"     gwpAct={gwpPart}    gwpAnt={gwpPartAnt}     crecPct={crecPart}     tabla={RAPEL_TABLAS_2026.particulares} condOk={true} />
            <BloqueGwp label="Empresas"         gwpAct={gwpEmp}     gwpAnt={gwpEmpAnt}      crecPct={crecEmp}      tabla={RAPEL_TABLAS_2026.empresas}     condOk={true} />
            <BloqueGwp label="PSC"              gwpAct={gwpPsc}     gwpAnt={gwpPscAnt}      crecPct={crecPsc}      tabla={RAPEL_TABLAS_2026.psc}          condOk={true} />
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          2 — RAPEL DE NUEVA PRODUCCIÓN
      ══════════════════════════════════════════════ */}
      <Section number="2" title="Rapel de Nueva Producción"
        subtitle="Tasa de Nueva Producción (TNP) global de la agencia + objetivos cuatrimestrales GWPNP">

        <div className="grid gap-6 md:grid-cols-2">
          {/* Panel TNP */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Tasa de Nueva Producción (TNP)</h3>
            <div className={`rounded-2xl border p-5 text-center mb-4 ${
              tnpFact === 1 ? "border-emerald-200 bg-emerald-50"
              : tnpFact > 0 ? "border-amber-200 bg-amber-50"
              : "border-red-200 bg-red-50"
            }`}>
              <div className="text-xs text-slate-500 mb-1">TNP global agencia · {MESES[effectiveMonth - 1]} {year}</div>
              <div className={`text-5xl font-bold ${
                tnpFact === 1 ? "text-emerald-700" : tnpFact > 0 ? "text-amber-700" : "text-red-700"
              }`}>{fmtPctAbs(tnp)}</div>
              <div className={`mt-2 text-sm font-semibold ${
                tnpFact === 1 ? "text-emerald-600" : tnpFact > 0 ? "text-amber-600" : "text-red-600"
              }`}>
                {tnpFact === 1  ? "✓ Tramo ≥15% — 100% de la parte TNP"
                 : tnpFact > 0 ? "◐ Tramo ≥12,5% — 70% de la parte TNP"
                 : "✗ < 12,5% — no se cobra la parte TNP (0€)"}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "≥ 15%",           min: 15,   max: Infinity, factor: "100%", desc: "Cobras el total" },
                { label: "≥ 12,5% y < 15%", min: 12.5, max: 15,      factor: "70%",  desc: "Cobras el 70%" },
                { label: "< 12,5%",         min: 0,    max: 12.5,     factor: "0%",   desc: "No se cobra" },
              ].map((t, i) => {
                const isActive = tnp >= t.min && tnp < t.max
                return (
                  <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                    isActive ? "bg-[#003A8F] border-[#003A8F]" : "border-slate-100 bg-slate-50"
                  }`}>
                    <div>
                      <div className={`font-semibold text-sm ${isActive ? "text-white" : "text-slate-700"}`}>{t.label}</div>
                      <div className={`text-xs ${isActive ? "text-blue-200" : "text-slate-400"}`}>{t.desc}</div>
                    </div>
                    <div className={`text-2xl font-bold ${isActive ? "text-white" : "text-slate-400"}`}>{t.factor}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cuatrimestral */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Objetivos cuatrimestrales de NP
              <span className="ml-2 text-xs font-normal text-slate-400">
                {q === 1 ? "Q1 · Ene–Abr" : q === 2 ? "Q2 · May–Ago" : "Q3 · Sep–Dic"}
              </span>
            </h3>
            <div className="space-y-5">
              {Object.entries(objQ).length > 0
                ? Object.entries(objQ).map(([key, obj]: any) => {
                    const actual = gwpnpBloque[key] ?? 0
                    if (obj === 0 && actual === 0) return null
                    return <ProgressBar key={key} label={LOB_LABELS[key] ?? key} actual={actual} objetivo={obj} />
                  })
                : <p className="text-sm text-slate-400 py-4">
                    Objetivos cuatrimestrales pendientes de configurar.
                  </p>
              }
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          3 — GRADOS
      ══════════════════════════════════════════════ */}
      <Section number="3" title="Grados"
        subtitle="Objetivos de cartera por segmento al cierre del año · GWP acumulado vs. umbral del grado"
        accent="#92400e">

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GradoCard
            titulo="Grado Empresa"
            icon={Trophy}
            items={[{ label: "GWPNP Empresas", actual: gwpnpEmpresa, objetivo: grados.empresa ?? 40000 }]}
          />
          <GradoCard
            titulo="Grado Salud"
            icon={Award}
            items={[{ label: "GWPNP Salud Individual", actual: gwpnpSaludInd, objetivo: grados.salud ?? 20000 }]}
          />
          <GradoCard
            titulo="Grado PSC"
            icon={Award}
            items={[{ label: "GWPNP Vida Col. + Salud Col.", actual: gwpnpPsc, objetivo: grados.psc ?? 12000 }]}
          />
          <GradoCard
            titulo="Grado Vida"
            icon={Trophy}
            items={[
              { label: "GWPNP Vida Riesgo Individual", actual: gwpnpVidaInd, objetivo: grados.vidaRiesgoInd ?? 10000 },
              { label: "GWPNP Ahorro",                 actual: gwpnpAhorro,  objetivo: grados.ahorro       ?? 120000 },
            ]}
          />
        </div>
      </Section>

    </div>
  )
}
