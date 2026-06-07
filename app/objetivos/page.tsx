"use client"

import { useEffect, useMemo, useState } from "react"
import {
  RAPEL_TABLAS_2026,
  RAPEL_TNP_2026,
  CONDICIONES_2026,
  calcDevengoBloqueA,
  factorTNP,
  type TramoRapel,
} from "@/lib/objetivos"
import {
  CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown, Minus, Info,
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toN = (v: any) => (v === null || v === undefined || isNaN(Number(v)) ? 0 : Number(v))
const fmtE = (v: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v)
const fmtPct = (v: number, decimals = 1) => `${v.toFixed(decimals)}%`

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const LABELS: Record<string, string> = {
  salud: "Salud", psc: "PSC", empresa: "Empresa",
  particulares: "Particulares", ahorro: "Ahorro", vida: "Vida",
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchMetrics(year: number, month: number) {
  const res = await fetch(`/api/metrics?year=${year}`)
  const rows: any[] = await res.json()
  const filtered = rows
    .filter((r: any) => String(r.mediator_code ?? r.medor_code) === "742776" && Number(r.month) <= month)
    .sort((a: any, b: any) => Number(b.month) - Number(a.month))
  return filtered[0] ?? null
}

async function fetchProduction(year: number, month: number) {
  const res = await fetch(`/api/production?year=${year}&month=${month}&medor=742776&medofis=TOTAL`)
  if (!res.ok) return { nv: [], vida: [] }
  return res.json()
}

// ─── LOB extractors ────────────────────────────────────────────────────────────

function getLobGwp(nv: any[], lob: string) {
  const r = nv.find((r: any) => r.lob?.toUpperCase() === lob && r.ramo === "Total" && !r.subramo)
  return toN(r?.gwp)
}
function getSubramoGwp(nv: any[], lob: string, subramo: string) {
  const r = nv.find((r: any) => r.lob?.toUpperCase() === lob && r.subramo?.toUpperCase() === subramo)
  return toN(r?.gwp)
}
function getSubramoGwpnp(nv: any[], lob: string, subramo: string) {
  const r = nv.find((r: any) => r.lob?.toUpperCase() === lob && r.subramo?.toUpperCase() === subramo)
  return toN(r?.gwpnp)
}
function getLobGwpnp(nv: any[], lob: string) {
  const r = nv.find((r: any) => r.lob?.toUpperCase() === lob && r.ramo === "Total" && !r.subramo)
  return toN(r?.gwpnp)
}
function getVidaRiesgoGwpnp(vida: any[]) {
  return vida
    .filter((r: any) => r.lob === "Pure Protection")
    .reduce((s: number, r: any) => s + toN(r.gwpnp), 0)
}
function getPscGwp(nv: any[], vida: any[]) {
  const saludCol = getSubramoGwp(nv, "SALUD", "SALUDCOL")
  const vidaCol  = vida.filter((r: any) => r.negocio === "Colectivo").reduce((s: number, r: any) => s + toN(r.gwp), 0)
  return saludCol + vidaCol
}

// ─── Semáforo de condición ─────────────────────────────────────────────────────

function Condicion({ label, valor, meta, ok, formato = "pct" }: {
  label: string; valor: number; meta: string; ok: boolean; formato?: "pct"|"euros"
}) {
  const display = formato === "euros" ? fmtE(valor) : fmtPct(valor)
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
      ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
    }`}>
      {ok
        ? <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
        : <XCircle className="text-red-500 flex-shrink-0" size={18} />
      }
      <div className="min-w-0">
        <div className="text-xs text-slate-500 truncate">{label}</div>
        <div className={`text-lg font-bold leading-tight ${ok ? "text-emerald-700" : "text-red-700"}`}>{display}</div>
        <div className="text-[10px] text-slate-400">Obj: {meta}</div>
      </div>
    </div>
  )
}

// ─── Bloque de crecimiento ─────────────────────────────────────────────────────

function BloqueRapel({ label, gwpActual, gwpAnterior, tabla, condicionesOk }: {
  label: string; gwpActual: number; gwpAnterior: number
  tabla: TramoRapel[]; condicionesOk: boolean
}) {
  const sinDato  = gwpAnterior === 0
  const crecPct  = !sinDato ? ((gwpActual - gwpAnterior) / gwpAnterior) * 100 : 0
  const { tramo, devengo } = condicionesOk && !sinDato
    ? calcDevengoBloqueA(gwpActual, crecPct, tabla)
    : { tramo: null, devengo: 0 }
  const tramoIdx = tramo ? tabla.indexOf(tramo) : -1
  const upColor  = crecPct > 0 ? "text-emerald-600" : crecPct < 0 ? "text-red-500" : "text-slate-400"

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-800 text-sm">{label}</span>
        {!sinDato && (
          <span className={`text-base font-bold flex items-center gap-1 ${upColor}`}>
            {crecPct > 0 ? <TrendingUp size={14}/> : crecPct < 0 ? <TrendingDown size={14}/> : <Minus size={14}/>}
            {fmtPct(Math.abs(crecPct))}
          </span>
        )}
        {sinDato && <span className="text-xs text-slate-400">Sin dato anterior</span>}
      </div>

      <div className="px-4 pb-2 flex gap-4 text-xs text-slate-500">
        <span>Ant: <strong className="text-slate-600">{sinDato ? "—" : fmtE(gwpAnterior)}</strong></span>
        <span>Act: <strong className="text-slate-800">{fmtE(gwpActual)}</strong></span>
      </div>

      <div className="px-3 pb-3 flex gap-1">
        {tabla.map((t, i) => {
          const isActive = i === tramoIdx
          const isPast   = i < tramoIdx
          return (
            <div key={i} className={`flex-1 rounded-lg px-1.5 py-1 text-center text-[10px] transition-all ${
              isActive ? "bg-[#003A8F] text-white font-bold shadow"
              : isPast  ? "bg-emerald-100 text-emerald-700 font-medium"
              : "bg-slate-100 text-slate-400"
            }`}>
              <div className="font-semibold">≥{t.min}%</div>
              <div className={isActive ? "text-blue-200" : ""}>{t.pct}%</div>
            </div>
          )
        })}
      </div>

      <div className={`px-4 py-2 border-t text-xs flex items-center justify-between ${
        devengo > 0 ? "border-emerald-100 bg-emerald-50" : "border-slate-100 bg-slate-50"
      }`}>
        <span className="text-slate-400">Devengo est. (A)</span>
        <span className={`font-bold ${devengo > 0 ? "text-emerald-700" : "text-slate-400"}`}>
          {devengo > 0 ? fmtE(devengo) : "—"}
        </span>
      </div>
    </div>
  )
}

// ─── Barra de progreso ─────────────────────────────────────────────────────────

function ProgressBar({ actual, objetivo, label }: { actual: number; objetivo: number; label: string }) {
  const pct = objetivo > 0 ? Math.min((actual / objetivo) * 100, 100) : 0
  const ok  = actual >= objetivo && objetivo > 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className={`font-semibold ${ok ? "text-emerald-600" : "text-slate-700"}`}>
          {fmtE(actual)} / {fmtE(objetivo)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${ok ? "bg-emerald-500" : "bg-[#003A8F]"}`}
          style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-right text-slate-400">{pct.toFixed(1)}% alcanzado</div>
    </div>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default function ObjetivosPage() {
  const [year, setYear]       = useState(2026)
  const [month, setMonth]     = useState(4)
  const [metrics, setMetrics] = useState<any>(null)
  const [prod, setProd]       = useState<{ nv: any[]; vida: any[] }>({ nv: [], vida: [] })
  const [prodAnt, setProdAnt] = useState<{ nv: any[]; vida: any[] }>({ nv: [], vida: [] })
  const [objetivos, setObjetivos] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchMetrics(year, month),
      fetchProduction(year, month),
      fetchProduction(year - 1, month),
      fetch(`/api/objetivos?year=${year}`).then(r => r.json()),
    ]).then(([m, p, pa, obj]) => {
      setMetrics(m); setProd(p); setProdAnt(pa); setObjetivos(obj); setLoading(false)
    }).catch(() => setLoading(false))
  }, [year, month])

  // ─── Métricas base ────────────────────────────────────────────────────────

  // Crecimiento IARD: calculado desde argos (suma GWP LOB totales no-vida)
  const totalIARDGwp    = prod.nv
    .filter((r: any) => r.ramo === "Total" && !r.subramo)
    .reduce((s: number, r: any) => s + toN(r.gwp), 0)
  const totalIARDGwpAnt = prodAnt.nv
    .filter((r: any) => r.ramo === "Total" && !r.subramo)
    .reduce((s: number, r: any) => s + toN(r.gwp), 0)
  const crecimientoIARD = totalIARDGwpAnt > 0
    ? ((totalIARDGwp - totalIARDGwpAnt) / totalIARDGwpAnt) * 100
    : 0
  const cor              = toN(metrics?.medofis?.cor)
  const pendiente        = toN(metrics?.medofis?.devolucionesPct)
  const saludGwpnp       = getLobGwpnp(prod.nv, "SALUD")
  const vidaRiesgoGwpnp  = getVidaRiesgoGwpnp(prod.vida)
  const tnpAgencia       = toN(metrics?.medofis?.tasaNpPct)
  const tnpFactor        = factorTNP(tnpAgencia)

  // GWP por bloque
  const gwpSaludInd    = getSubramoGwp(prod.nv,    "SALUD",          "SALUDIND")
  const gwpSaludIndAnt = getSubramoGwp(prodAnt.nv,  "SALUD",          "SALUDIND")
  const gwpPart        = getLobGwp(prod.nv,    "PARTICULARES")
  const gwpPartAnt     = getLobGwp(prodAnt.nv,  "PARTICULARES")
  const gwpEmp         = getLobGwp(prod.nv,    "EMPRESAS")
  const gwpEmpAnt      = getLobGwp(prodAnt.nv,  "EMPRESAS")
  const gwpPsc         = getPscGwp(prod.nv,    prod.vida)
  const gwpPscAnt      = getPscGwp(prodAnt.nv,  prodAnt.vida)

  // ─── Condiciones ─────────────────────────────────────────────────────────

  const condOk = useMemo(() => ({
    crecimiento: crecimientoIARD > CONDICIONES_2026.crecimientoIARDMin,
    cor:         cor < CONDICIONES_2026.corMax,
    pendiente:   pendiente < CONDICIONES_2026.pendienteMax,
    vida:        vidaRiesgoGwpnp >= CONDICIONES_2026.vidaRiesgoMin,
    salud:       saludGwpnp >= CONDICIONES_2026.saludMin,
  }), [crecimientoIARD, cor, pendiente, vidaRiesgoGwpnp, saludGwpnp])

  const todasCondiciones = Object.values(condOk).every(Boolean)

  // ─── Devengo total ────────────────────────────────────────────────────────

  const devengos = useMemo(() => {
    const calc = (gwpA: number, gwpP: number, tabla: TramoRapel[]) => {
      const crec = gwpP > 0 ? ((gwpA - gwpP) / gwpP) * 100 : 0
      return calcDevengoBloqueA(gwpA, crec, tabla)
    }
    const r1 = calc(gwpSaludInd, gwpSaludIndAnt, RAPEL_TABLAS_2026.saludInd)
    const r2 = calc(gwpPart,     gwpPartAnt,     RAPEL_TABLAS_2026.particulares)
    const r3 = calc(gwpEmp,      gwpEmpAnt,      RAPEL_TABLAS_2026.empresas)
    const r4 = calc(gwpPsc,      gwpPscAnt,      RAPEL_TABLAS_2026.psc)

    const totalA = todasCondiciones ? r1.devengo + r2.devengo + r3.devengo + r4.devengo : 0
    const totalPotencial = r1.devengoPotencial + r2.devengoPotencial + r3.devengoPotencial + r4.devengoPotencial
    const totalB = todasCondiciones ? totalPotencial * 0.30 * tnpFactor : 0
    const total  = Math.min(totalA + totalB, CONDICIONES_2026.devengMax)
    return { totalA, totalB, total }
  }, [todasCondiciones, tnpFactor, gwpSaludInd, gwpSaludIndAnt, gwpPart, gwpPartAnt, gwpEmp, gwpEmpAnt, gwpPsc, gwpPscAnt])

  // ─── Cuatrimestral ────────────────────────────────────────────────────────

  const q = month <= 4 ? 1 : month <= 8 ? 2 : 3
  const cuatrimestralObj = objetivos?.rapelCuatrimestral?.[String(q)] ?? {}
  const gwpnpBloque: Record<string, number> = {
    salud:        getSubramoGwpnp(prod.nv, "SALUD", "SALUDIND"),
    psc:          getSubramoGwpnp(prod.nv, "SALUD", "SALUDCOL") +
                    prod.vida.filter((r: any) => r.negocio === "Colectivo").reduce((s: number, r: any) => s + toN(r.gwpnp), 0),
    empresa:      getLobGwpnp(prod.nv, "EMPRESAS"),
    particulares: getLobGwpnp(prod.nv, "PARTICULARES"),
    ahorro:       prod.vida.filter((r: any) => r.negocio === "Individual" && r.lob !== "Pure Protection")
                    .reduce((s: number, r: any) => s + toN(r.gwpnp ?? r.gwp), 0),
    vida:         getVidaRiesgoGwpnp(prod.vida),
  }

  if (loading) return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Objetivos</h1>
      <div className="panel text-center py-12 text-slate-400">Cargando…</div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Objetivos</h1>
          <p className="text-sm text-slate-400 mt-1">Agencia 742776 · V3M Proyecto Asegurador · datos YTD hasta {MESES[month - 1]} {year}</p>
        </div>
        <div className="flex gap-3">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none bg-white">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none bg-white">
            {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ── 1. Condiciones de devengo ── */}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-panel">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Condiciones de devengo</h2>
            <p className="text-xs text-slate-400 mt-0.5">Todas deben cumplirse al cierre del año para que aplique el rapel</p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            todasCondiciones ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}>
            {todasCondiciones ? "✓ Cumplidas" : "⚠ Pendientes"}
          </span>
        </div>
        <div className="p-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Condicion label="Crecimiento IARD"    valor={crecimientoIARD}   meta="> 0%"                               ok={condOk.crecimiento} />
          <Condicion label="CoR (rentabilidad)"  valor={cor}               meta="< 100%"                             ok={condOk.cor} />
          <Condicion label="Pte. cobro"          valor={pendiente}         meta="< 2%"                               ok={condOk.pendiente} />
          <Condicion label="Vida Riesgo (GWPNP)" valor={vidaRiesgoGwpnp}   meta={`≥ ${fmtE(CONDICIONES_2026.vidaRiesgoMin)}`} ok={condOk.vida}  formato="euros" />
          <Condicion label="Salud (GWPNP)"       valor={saludGwpnp}        meta={`≥ ${fmtE(CONDICIONES_2026.saludMin)}`}      ok={condOk.salud} formato="euros" />
        </div>
        {!todasCondiciones && (
          <div className="mx-5 mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex gap-2 text-xs text-amber-800">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            Si alguna condición no se cumple al cierre del año, no se devenga ningún importe de rapel.
          </div>
        )}
      </section>

      {/* ── 2. Rapel Anual ── */}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-panel">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Rapel Anual</h2>
            <p className="text-xs text-slate-400 mt-0.5">Crecimiento GWP por bloque · representa el 70% del devengo total</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">Liquidación Q1 {year + 1}</span>
        </div>

        <div className="p-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BloqueRapel label="Salud Individual"  gwpActual={gwpSaludInd} gwpAnterior={gwpSaludIndAnt} tabla={RAPEL_TABLAS_2026.saludInd}    condicionesOk={todasCondiciones} />
          <BloqueRapel label="Particulares"       gwpActual={gwpPart}    gwpAnterior={gwpPartAnt}    tabla={RAPEL_TABLAS_2026.particulares} condicionesOk={todasCondiciones} />
          <BloqueRapel label="Empresas"           gwpActual={gwpEmp}     gwpAnterior={gwpEmpAnt}     tabla={RAPEL_TABLAS_2026.empresas}     condicionesOk={todasCondiciones} />
          <BloqueRapel label="PSC"                gwpActual={gwpPsc}     gwpAnterior={gwpPscAnt}     tabla={RAPEL_TABLAS_2026.psc}          condicionesOk={todasCondiciones} />
        </div>

        <div className="mx-5 mb-5 rounded-2xl border border-[#003A8F]/20 bg-[#003A8F]/5 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#003A8F]">Devengo estimado (Parte A · 70%)</span>
          <span className="text-xl font-bold text-[#003A8F]">{fmtE(devengos.totalA)}</span>
        </div>
      </section>

      {/* ── 3. Rapel de Nueva Producción ── */}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-panel">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Rapel de Nueva Producción</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tasa de Nueva Producción (TNP) de la agencia · representa el 30% del devengo total</p>
        </div>

        <div className="p-5 grid gap-5 md:grid-cols-2">
          {/* TNP actual */}
          <div className="space-y-3">
            <div className={`rounded-2xl border p-5 text-center ${
              tnpFactor === 1 ? "border-emerald-200 bg-emerald-50"
              : tnpFactor > 0 ? "border-amber-200 bg-amber-50"
              : "border-red-200 bg-red-50"
            }`}>
              <div className="text-xs text-slate-500 mb-1">TNP global de la agencia</div>
              <div className={`text-4xl font-bold ${
                tnpFactor === 1 ? "text-emerald-700" : tnpFactor > 0 ? "text-amber-700" : "text-red-700"
              }`}>{fmtPct(tnpAgencia)}</div>
              <div className={`mt-2 text-sm font-semibold ${
                tnpFactor === 1 ? "text-emerald-600" : tnpFactor > 0 ? "text-amber-600" : "text-red-600"
              }`}>
                {tnpFactor === 1 ? "✓ Tramo ≥15% — 100% de la parte B"
                 : tnpFactor > 0 ? "◐ Tramo ≥12,5% — 70% de la parte B"
                 : "✗ < 12,5% — 0% de la parte B"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">Devengo estimado (Parte B · 30%)</span>
              <span className={`text-xl font-bold ${devengos.totalB > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                {fmtE(devengos.totalB)}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex gap-2 items-start">
              <Info size={12} className="flex-shrink-0 mt-0.5"/>
              TNP = GWPNP año actual / GWP año anterior, sobre el total IARD de la agencia.
            </div>
          </div>

          {/* Tabla de tramos */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tramos del contrato 2026</div>
            <div className="space-y-2">
              {RAPEL_TNP_2026.map((t, i) => {
                const isActive = tnpAgencia >= t.min && tnpAgencia < t.max
                const label = i === 0 ? "≥ 15%" : i === 1 ? "≥ 12,5% y < 15%" : "< 12,5%"
                return (
                  <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${
                    isActive ? "bg-[#003A8F] border-[#003A8F] text-white" : "border-slate-100 bg-slate-50 text-slate-600"
                  }`}>
                    <span className={`font-medium text-sm ${isActive ? "text-white" : ""}`}>{label}</span>
                    <span className={`font-bold text-xl ${isActive ? "text-white" : "text-slate-800"}`}>{t.pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Total estimado ── */}
      <section className="overflow-hidden rounded-3xl border-2 border-[#003A8F] bg-white shadow-panel">
        <div className="px-6 py-4 bg-[#003A8F] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Estimación total rapel {year}</h2>
            <p className="text-xs text-blue-200 mt-0.5">Datos YTD · liquidación Q1 {year + 1} sobre año cerrado</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{fmtE(devengos.total)}</div>
            <div className="text-xs text-blue-200 mt-0.5">
              {devengos.total >= CONDICIONES_2026.devengMax
                ? "⚠ Límite máximo alcanzado"
                : devengos.total >= CONDICIONES_2026.devengMin
                ? `Faltan ${fmtE(CONDICIONES_2026.devengMax - devengos.total)} para el máximo`
                : `Mínimo: ${fmtE(CONDICIONES_2026.devengMin)}`}
            </div>
          </div>
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-3">
          <div className="text-center rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <div className="text-xs text-slate-400 mb-1">Parte A · Crecimiento GWP</div>
            <div className="text-2xl font-bold text-[#003A8F]">{fmtE(devengos.totalA)}</div>
            <div className="text-xs text-slate-400 mt-1">70% del devengo</div>
          </div>
          <div className="text-center rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <div className="text-xs text-slate-400 mb-1">Parte B · TNP</div>
            <div className={`text-2xl font-bold ${devengos.totalB > 0 ? "text-emerald-700" : "text-slate-400"}`}>
              {fmtE(devengos.totalB)}
            </div>
            <div className="text-xs text-slate-400 mt-1">30% del devengo · factor {(tnpFactor * 100).toFixed(0)}%</div>
          </div>
          <div className={`text-center rounded-2xl border-2 p-4 ${
            devengos.total >= CONDICIONES_2026.devengMin ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="text-xs text-slate-500 mb-1">Total A + B</div>
            <div className={`text-2xl font-bold ${devengos.total >= CONDICIONES_2026.devengMin ? "text-emerald-700" : "text-slate-400"}`}>
              {fmtE(devengos.total)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Máx. {fmtE(CONDICIONES_2026.devengMax)}</div>
          </div>
        </div>
        {!todasCondiciones && (
          <div className="mx-5 mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700 flex gap-2">
            <XCircle size={14} className="flex-shrink-0 mt-0.5"/>
            No se devenga rapel si alguna condición de devengo no se cumple al cierre del año.
          </div>
        )}
      </section>

      {/* ── 5. Objetivos cuatrimestrales de nueva producción ── */}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-panel">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Objetivos cuatrimestrales de nueva producción
            <span className="ml-2 text-sm font-normal text-slate-400">
              {q === 1 ? "Q1 Ene–Abr" : q === 2 ? "Q2 May–Ago" : "Q3 Sep–Dic"}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Campaña independiente del rapel anual · GWPNP acumulado vs. objetivo del cuatrimestre</p>
        </div>
        <div className="p-5 space-y-5">
          {Object.entries(cuatrimestralObj).map(([key, obj]: any) => {
            const actual = gwpnpBloque[key] ?? 0
            if (obj === 0 && actual === 0) return null
            return (
              <ProgressBar key={key} label={LABELS[key] ?? key} actual={actual} objetivo={obj} />
            )
          })}
          {Object.values(cuatrimestralObj).every(v => v === 0) && (
            <p className="text-sm text-slate-400 text-center py-4">
              Objetivos cuatrimestrales para este período pendientes de configurar.
            </p>
          )}
        </div>
      </section>

    </div>
  )
}
