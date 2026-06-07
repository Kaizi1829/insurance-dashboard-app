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
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react"

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
async function fetchMetrics(year: number, month: number) {
  const res = await fetch(`/api/metrics?year=${year}`)
  const rows: any[] = await res.json()
  return rows
    .filter((r: any) => String(r.mediator_code ?? r.medor_code) === "742776" && Number(r.month) <= month)
    .sort((a: any, b: any) => Number(b.month) - Number(a.month))[0] ?? null
}
async function fetchProduction(year: number, month: number) {
  const res = await fetch(`/api/production?year=${year}&month=${month}&medor=742776&medofis=TOTAL`)
  if (!res.ok) return { nv: [], vida: [] }
  return res.json()
}

// ─── Extractores de datos ──────────────────────────────────────────────────────
const lobGwp    = (nv: any[], lob: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.ramo === "Total" && !r.subramo)?.gwp)
const lobGwpnp  = (nv: any[], lob: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.ramo === "Total" && !r.subramo)?.gwpnp)
const subGwp    = (nv: any[], lob: string, sub: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.subramo?.toUpperCase() === sub)?.gwp)
const subGwpnp  = (nv: any[], lob: string, sub: string) => toN(nv.find(r => r.lob?.toUpperCase() === lob && r.subramo?.toUpperCase() === sub)?.gwpnp)
const vidaRiesgoNP = (vida: any[]) => vida.filter(r => r.lob === "Pure Protection").reduce((s, r) => s + toN(r.gwpnp), 0)
const pscGwp    = (nv: any[], vida: any[]) =>
  subGwp(nv, "SALUD", "SALUDCOL") + vida.filter(r => r.negocio === "Colectivo").reduce((s, r) => s + toN(r.gwp), 0)
const crec = (act: number, ant: number) => ant > 0 ? ((act - ant) / ant) * 100 : 0

// ─── Componente: fila de condición ─────────────────────────────────────────────
function FilaCondicion({ label, valor, objetivo, ok, esEuros = false }: {
  label: string; valor: number; objetivo: string; ok: boolean; esEuros?: boolean
}) {
  return (
    <div className={`grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 ${
      ok ? "hover:bg-emerald-50/30" : "hover:bg-red-50/30"
    } transition-colors`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={`text-sm font-bold text-right ${ok ? "text-emerald-700" : "text-red-600"}`}>
        {esEuros ? fmtE(valor) : fmtPctAbs(valor)}
      </span>
      <span className="text-xs text-slate-400 text-right">{objetivo}</span>
      <span>
        {ok
          ? <CheckCircle2 size={18} className="text-emerald-500" />
          : <XCircle size={18} className="text-red-500" />
        }
      </span>
    </div>
  )
}

// ─── Componente: bloque de crecimiento por segmento ────────────────────────────
function BloqueGwp({ label, gwpAct, gwpAnt, tabla, condOk }: {
  label: string; gwpAct: number; gwpAnt: number; tabla: TramoRapel[]; condOk: boolean
}) {
  const sinDato = gwpAnt === 0
  const crecPct = !sinDato ? crec(gwpAct, gwpAnt) : 0
  const { tramo, devengo } = condOk && !sinDato
    ? calcDevengoBloqueA(gwpAct, crecPct, tabla)
    : { tramo: null as any, devengo: 0 }
  const tramoIdx = tramo ? tabla.indexOf(tramo) : -1
  const color = crecPct > 0 ? "text-emerald-600" : crecPct < 0 ? "text-red-500" : "text-slate-400"

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
      {/* Header del bloque */}
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
      {/* GWP anterior → actual */}
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
      {/* Tramos del contrato */}
      <div className="px-3 pb-3 flex gap-1">
        {tabla.map((t, i) => {
          const isActive = i === tramoIdx
          const isPast = i < tramoIdx
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
      {/* Devengo estimado */}
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

// ─── Componente: barra de progreso ─────────────────────────────────────────────
function ProgressBar({ label, actual, objetivo }: { label: string; actual: number; objetivo: number }) {
  const pct = objetivo > 0 ? Math.min((actual / objetivo) * 100, 100) : 0
  const ok = actual >= objetivo && objetivo > 0
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

// ─── Página ────────────────────────────────────────────────────────────────────
export default function ObjetivosPage() {
  const [year,  setYear]  = useState(2026)
  const [month, setMonth] = useState(4)
  const [metrics,   setMetrics]   = useState<any>(null)
  const [prod,      setProd]      = useState<{ nv: any[]; vida: any[] }>({ nv: [], vida: [] })
  const [prodAnt,   setProdAnt]   = useState<{ nv: any[]; vida: any[] }>({ nv: [], vida: [] })
  const [objetivos, setObjetivos] = useState<any>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchMetrics(year, month),
      fetchProduction(year, month),
      fetchProduction(year - 1, month),
      fetch(`/api/objetivos?year=${year}`).then(r => r.json()),
    ]).then(([m, p, pa, obj]) => {
      setMetrics(m); setProd(p); setProdAnt(pa); setObjetivos(obj)
    }).finally(() => setLoading(false))
  }, [year, month])

  // ── Crecimiento IARD desde argos (GWP total no-vida) ──────────────────────
  const totalIARDAct = prod.nv.filter(r => r.ramo === "Total" && !r.subramo).reduce((s, r) => s + toN(r.gwp), 0)
  const totalIARDAnt = prodAnt.nv.filter(r => r.ramo === "Total" && !r.subramo).reduce((s, r) => s + toN(r.gwp), 0)
  const crecIARD     = crec(totalIARDAct, totalIARDAnt)

  // ── Métricas de calidad (de la API de métricas) ───────────────────────────
  const cor       = toN(metrics?.medofis?.cor)
  const pendiente = toN(metrics?.medofis?.devolucionesPct)   // %PTE P.Adq
  const tnp       = toN(metrics?.medofis?.tasaNpPct)          // TNP global agencia

  // ── GWPNP mínimos (condiciones del contrato) ──────────────────────────────
  const saludNP    = lobGwpnp(prod.nv, "SALUD")
  const vidaRNP    = vidaRiesgoNP(prod.vida)

  // ── GWP por bloque (rapel crecimiento) ───────────────────────────────────
  const gwpSaludInd    = subGwp(prod.nv,    "SALUD", "SALUDIND")
  const gwpSaludIndAnt = subGwp(prodAnt.nv, "SALUD", "SALUDIND")
  const gwpPart        = lobGwp(prod.nv,    "PARTICULARES")
  const gwpPartAnt     = lobGwp(prodAnt.nv, "PARTICULARES")
  const gwpEmp         = lobGwp(prod.nv,    "EMPRESAS")
  const gwpEmpAnt      = lobGwp(prodAnt.nv, "EMPRESAS")
  const gwpPsc         = pscGwp(prod.nv,    prod.vida)
  const gwpPscAnt      = pscGwp(prodAnt.nv, prodAnt.vida)

  // ── Condiciones ───────────────────────────────────────────────────────────
  const condOk = useMemo(() => ({
    crecimiento: crecIARD  > CONDICIONES_2026.crecimientoIARDMin,
    cor:         cor       < CONDICIONES_2026.corMax,
    pendiente:   pendiente < CONDICIONES_2026.pendienteMax,
    vida:        vidaRNP   >= CONDICIONES_2026.vidaRiesgoMin,
    salud:       saludNP   >= CONDICIONES_2026.saludMin,
  }), [crecIARD, cor, pendiente, vidaRNP, saludNP])

  const todasOk = Object.values(condOk).every(Boolean)
  const tnpFact = factorTNP(tnp)

  // ── Cálculo del rapel ─────────────────────────────────────────────────────
  const devengos = useMemo(() => {
    const calc = (act: number, ant: number, tabla: TramoRapel[]) => {
      const c = crec(act, ant)
      return calcDevengoBloqueA(act, c, tabla)
    }
    const r1 = calc(gwpSaludInd, gwpSaludIndAnt, RAPEL_TABLAS_2026.saludInd)
    const r2 = calc(gwpPart,     gwpPartAnt,     RAPEL_TABLAS_2026.particulares)
    const r3 = calc(gwpEmp,      gwpEmpAnt,      RAPEL_TABLAS_2026.empresas)
    const r4 = calc(gwpPsc,      gwpPscAnt,      RAPEL_TABLAS_2026.psc)

    const crecimiento = todasOk ? r1.devengo + r2.devengo + r3.devengo + r4.devengo : 0
    const potencial   = r1.devengoPotencial + r2.devengoPotencial + r3.devengoPotencial + r4.devengoPotencial
    const nuevaProd   = todasOk ? potencial * 0.30 * tnpFact : 0
    const total       = Math.min(crecimiento + nuevaProd, CONDICIONES_2026.devengMax)
    return { crecimiento, nuevaProd, total }
  }, [todasOk, tnpFact, gwpSaludInd, gwpSaludIndAnt, gwpPart, gwpPartAnt, gwpEmp, gwpEmpAnt, gwpPsc, gwpPscAnt])

  // ── Cuatrimestral ─────────────────────────────────────────────────────────
  const q = month <= 4 ? 1 : month <= 8 ? 2 : 3
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

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Objetivos {year}</h1>
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-400">Cargando…</div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Header + selectores ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Objetivos {year}</h1>
          <p className="text-sm text-slate-400 mt-1">Agencia 742776 · acumulado hasta {MESES[month - 1]} {year}</p>
        </div>
        <div className="flex gap-3">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none">
            {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none">
            {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RESUMEN RAPEL — el gran número
      ══════════════════════════════════════════════ */}
      <div className="rounded-3xl overflow-hidden border-2 border-[#003A8F]">
        <div className="bg-[#003A8F] px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-blue-200 text-sm font-medium">Rapel anual estimado {year}</div>
            <div className="text-white text-xs mt-0.5 opacity-70">
              Si cerráramos el año hoy · liquidación al cierre del año
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{fmtE(devengos.total)}</div>
            <div className="text-sm text-blue-200 mt-1">
              {devengos.total >= CONDICIONES_2026.devengMax
                ? "⚠ Tope máximo alcanzado (125.000€)"
                : `Faltan ${fmtE(CONDICIONES_2026.devengMax - devengos.total)} para el máximo`}
            </div>
          </div>
        </div>
        {/* Desglose rápido */}
        <div className="bg-[#002d70] grid grid-cols-2 divide-x divide-[#003A8F]">
          <div className="px-6 py-3 flex items-center justify-between">
            <span className="text-blue-300 text-sm">Crecimiento GWP (70%)</span>
            <span className="text-white font-bold text-lg">{fmtE(devengos.crecimiento)}</span>
          </div>
          <div className="px-6 py-3 flex items-center justify-between">
            <span className="text-blue-300 text-sm">Nueva Producción (30%)</span>
            <span className="text-white font-bold text-lg">{fmtE(devengos.nuevaProd)}</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          BLOQUE 1 — ¿Se cumple para cobrar?
      ══════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Condiciones para cobrar el rapel</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Las 5 deben cumplirse al cierre del año · si falla una, no se cobra nada
            </p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            todasOk ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}>
            {todasOk ? "✓ Todas cumplidas" : "⚠ Pendientes"}
          </span>
        </div>

        {/* Cabecera */}
        <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-50">
          <span>Condición</span>
          <span className="text-right">Valor actual</span>
          <span className="text-right">Objetivo</span>
          <span className="w-[18px]" />
        </div>

        <FilaCondicion label="Crecimiento GWP IARD" valor={crecIARD}    objetivo="> 0%"                            ok={condOk.crecimiento} />
        <FilaCondicion label="CoR (rentabilidad)"   valor={cor}         objetivo="< 100%"                          ok={condOk.cor} />
        <FilaCondicion label="Pendiente de cobro"   valor={pendiente}   objetivo="< 2%"                            ok={condOk.pendiente} />
        <FilaCondicion label="Vida Riesgo NP"       valor={vidaRNP}     objetivo={`≥ ${fmtE(CONDICIONES_2026.vidaRiesgoMin)}`} ok={condOk.vida}  esEuros />
        <FilaCondicion label="Salud NP"             valor={saludNP}     objetivo={`≥ ${fmtE(CONDICIONES_2026.saludMin)}`}      ok={condOk.salud} esEuros />

        {!todasOk && (
          <div className="mx-5 mb-4 mt-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex gap-2 text-xs text-amber-800">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            Mientras haya condiciones sin cumplir, el rapel estimado es 0€. El cálculo de arriba es el potencial si se cumplen todas.
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════
          BLOQUE 2 — Crecimiento GWP (70%)
      ══════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Crecimiento GWP por segmento</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Representa el 70% del rapel · cada segmento tiene su propia tabla de tramos
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Aportación total</div>
            <div className="text-xl font-bold text-[#003A8F]">{fmtE(devengos.crecimiento)}</div>
          </div>
        </div>
        <div className="p-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BloqueGwp label="Salud Individual"  gwpAct={gwpSaludInd} gwpAnt={gwpSaludIndAnt} tabla={RAPEL_TABLAS_2026.saludInd}    condOk={todasOk} />
          <BloqueGwp label="Particulares"       gwpAct={gwpPart}    gwpAnt={gwpPartAnt}     tabla={RAPEL_TABLAS_2026.particulares} condOk={todasOk} />
          <BloqueGwp label="Empresas"           gwpAct={gwpEmp}     gwpAnt={gwpEmpAnt}      tabla={RAPEL_TABLAS_2026.empresas}     condOk={todasOk} />
          <BloqueGwp label="PSC"                gwpAct={gwpPsc}     gwpAnt={gwpPscAnt}      tabla={RAPEL_TABLAS_2026.psc}          condOk={todasOk} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BLOQUE 3 — Tasa de Nueva Producción (30%)
      ══════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Tasa de Nueva Producción (TNP)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Representa el 30% del rapel · TNP = GWPNP {year} / GWP {year - 1}, total agencia
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Aportación total</div>
            <div className={`text-xl font-bold ${devengos.nuevaProd > 0 ? "text-emerald-700" : "text-slate-400"}`}>
              {fmtE(devengos.nuevaProd)}
            </div>
          </div>
        </div>
        <div className="p-5 grid gap-5 md:grid-cols-2">
          {/* TNP actual */}
          <div className={`rounded-2xl border p-6 text-center ${
            tnpFact === 1 ? "border-emerald-200 bg-emerald-50"
            : tnpFact > 0 ? "border-amber-200 bg-amber-50"
            : "border-red-200 bg-red-50"
          }`}>
            <div className="text-sm text-slate-500 mb-1">TNP global de la agencia</div>
            <div className={`text-5xl font-bold ${
              tnpFact === 1 ? "text-emerald-700" : tnpFact > 0 ? "text-amber-700" : "text-red-700"
            }`}>{fmtPctAbs(tnp)}</div>
            <div className={`mt-3 text-sm font-semibold ${
              tnpFact === 1 ? "text-emerald-600" : tnpFact > 0 ? "text-amber-600" : "text-red-600"
            }`}>
              {tnpFact === 1 ? "✓ Tramo ≥15% — cobras el 100% de la parte TNP"
               : tnpFact > 0 ? "◐ Tramo ≥12,5% — cobras el 70% de la parte TNP"
               : "✗ Tramo < 12,5% — no se cobra la parte TNP (0€)"}
            </div>
          </div>
          {/* Tabla de tramos */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Tramos según contrato 2026
            </div>
            <div className="space-y-2">
              {[
                { label: "≥ 15%",            min: 15,  max: Infinity, factor: "100%", desc: "Cobras el total" },
                { label: "≥ 12,5% y < 15%",  min: 12.5, max: 15,     factor: "70%",  desc: "Cobras el 70%" },
                { label: "< 12,5%",          min: 0,   max: 12.5,    factor: "0%",   desc: "No se cobra" },
              ].map((t, i) => {
                const isActive = tnp >= t.min && tnp < t.max
                return (
                  <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${
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
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BLOQUE 4 — Objetivos cuatrimestrales NP
      ══════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Objetivos cuatrimestrales de nueva producción
            <span className="ml-2 text-sm font-normal text-slate-400">
              {q === 1 ? "Q1 · Ene–Abr" : q === 2 ? "Q2 · May–Ago" : "Q3 · Sep–Dic"}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Campaña independiente del rapel anual · GWPNP acumulado vs. objetivo del cuatrimestre
          </p>
        </div>
        <div className="p-5 space-y-5">
          {Object.entries(objQ).length > 0
            ? Object.entries(objQ).map(([key, obj]: any) => {
                const actual = gwpnpBloque[key] ?? 0
                if (obj === 0 && actual === 0) return null
                return <ProgressBar key={key} label={LOB_LABELS[key] ?? key} actual={actual} objetivo={obj} />
              })
            : <p className="text-sm text-slate-400 text-center py-4">
                Objetivos cuatrimestrales para este período pendientes de configurar.
              </p>
          }
        </div>
      </section>

    </div>
  )
}
