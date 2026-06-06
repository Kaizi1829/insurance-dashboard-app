"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BadgeEuro, ShieldCheck, TrendingUp, Percent, ArrowUpRight, Target, AlertTriangle,
} from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  CartesianGrid, LineChart, Line, XAxis, YAxis, ReferenceLine,
} from "recharts"
import ProgressCard from "./components/ProgressCard"

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ["#F6D88A","#9CC3FF","#F6A6A6","#C8A2FF","#9FE3B0","#FDB97D"]
const MEDOFIS_COLORS = ["#003A8F","#F6D88A","#9CC3FF","#9FE3B0","#C8A2FF","#F6A6A6"]

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const MONTHS_FULL = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNumber(v: any): number {
  if (v === undefined || v === null || v === "") return 0
  if (typeof v === "number") return v
  let s = v.toString().trim().replace("€","").replace(/\s/g,"")
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g,"").replace(",",".")
  else if (s.includes(",")) s = s.replace(",",".")
  return Number(s.replace(/[^0-9.-]/g,"")) || 0
}

function fmtInt(v: any) {
  const n = toNumber(v), sign = n < 0 ? "-" : "", abs = Math.abs(n)
  return sign + Math.round(abs).toLocaleString("es-ES")
}
function fmtEuros(v: any) { return `${fmtInt(v)} €` }
function fmtPct(v: any) {
  const n = toNumber(v), sign = n < 0 ? "-" : "", abs = Math.abs(n)
  return `${sign}${abs.toFixed(2).replace(".",",")}%`
}

function getMediatorCode(m: any) { return m?.mediator_code ?? m?.mediatorCode ?? "" }

// ─── Pie label — renders outside the arc, no threshold ────────────────────────

function PieLabel({ cx, cy, midAngle, outerRadius, percent }: any) {
  if (!percent || percent < 0.005) return null  // only skip truly invisible slivers
  const R = Math.PI / 180
  const r = outerRadius + 32
  const x = cx + r * Math.cos(-midAngle * R)
  const y = cy + r * Math.sin(-midAngle * R)
  return (
    <text
      x={x} y={y} fill="#475569"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11} fontWeight={600}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

// ─── Production data helpers ──────────────────────────────────────────────────

type NVRow   = { lob: string; ramo: string; subramo: string | null; gwpnp: any; gwpnpa: any }
type VRow    = { lob: string; negocio: string; gwpnp: any; gwpnpa: any; gwp: any; gwpa: any }
type ProdVal = { actual: number; anterior: number }
type ProdRow = { name: string; actual: number; anterior: number; color: string; isHighlighted: boolean }

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

// Sum all subramo rows for a given lob + ramo (no 'Total' subramo exists in this schema)
function nvRamo(rows: NVRow[], lob: string, ramo: string): ProdVal {
  const match = rows.filter(r =>
    r.lob?.toUpperCase() === lob.toUpperCase() &&
    r.ramo?.toUpperCase() === ramo.toUpperCase()
  )
  return {
    actual:   match.reduce((s, r) => s + toNumber(r.gwpnp), 0),
    anterior: match.reduce((s, r) => s + toNumber(r.gwpnpa), 0),
  }
}

// Specific subramo row
function nvSubramo(rows: NVRow[], lob: string, subramo: string): ProdVal {
  const r = rows.find(r =>
    r.lob?.toUpperCase() === lob.toUpperCase() &&
    r.subramo?.toUpperCase() === subramo.toUpperCase()
  )
  return { actual: toNumber(r?.gwpnp), anterior: toNumber(r?.gwpnpa) }
}

// LOB total row (ramo='Total', subramo=null)
function nvLob(rows: NVRow[], lob: string): ProdVal {
  const r = rows.find(r =>
    r.lob?.toUpperCase() === lob.toUpperCase() &&
    r.ramo === "Total" && !r.subramo
  )
  if (r) return { actual: toNumber(r.gwpnp), anterior: toNumber(r.gwpnpa) }
  // Fallback: sum all ramo-level rows
  const uniqRamos = [...new Set(
    rows.filter(r => r.lob?.toUpperCase() === lob.toUpperCase() && r.ramo !== "Total").map(r => r.ramo)
  )]
  return uniqRamos.reduce((acc, ramo) => {
    const v = nvRamo(rows, lob, ramo)
    return { actual: acc.actual + v.actual, anterior: acc.anterior + v.anterior }
  }, { actual: 0, anterior: 0 } as ProdVal)
}

// Get all unique ramo names for a LOB (excluding 'Total')
function nvRamos(rows: NVRow[], lob: string): string[] {
  return [...new Set(
    rows
      .filter(r => r.lob?.toUpperCase() === lob.toUpperCase() && r.ramo !== "Total")
      .map(r => r.ramo)
  )].sort()
}

// Build rows dynamically from whatever ramos exist for a LOB
function buildLobRows(rows: NVRow[], lob: string, color: string): ProdRow[] {
  const ramos = nvRamos(rows, lob)
  const dataRows: ProdRow[] = ramos.map(ramo => ({
    name: titleCase(ramo),
    ...nvRamo(rows, lob, ramo),
    color,
    isHighlighted: false,
  }))
  dataRows.push({
    name: `Total ${titleCase(lob)}`,
    ...nvLob(rows, lob),
    color,
    isHighlighted: true,
  })
  return dataRows
}

// Vida / Ahorro by product (lob) and optionally by negocio (Individual / Colectivo)
function vidaByLob(rows: VRow[], lob: string, negocio?: string): ProdVal {
  const match = rows.filter(r =>
    r.lob === lob && (!negocio || r.negocio === negocio)
  )
  return {
    actual:   match.reduce((s, r) => s + toNumber(r.gwpnp ?? r.gwp), 0),
    anterior: match.reduce((s, r) => s + toNumber(r.gwpnpa ?? r.gwpa), 0),
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [year, setYear]               = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [metrics, setMetrics]         = useState<any[]>([])
  const [years, setYears]             = useState<number[]>([])
  const [objetivos, setObjetivos]     = useState<any>(null)
  const [nvRows, setNvRows]           = useState<NVRow[]>([])
  const [vidaRows, setVidaRows]       = useState<VRow[]>([])

  // ── Load metrics on year change ──
  useEffect(() => {
    async function load() {
      try {
        const [metricsRes, objetivosRes, periodsRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/objetivos"),
          fetch("/api/available-periods"),
        ])
        const periodsJson   = await periodsRes.json()
        const metricsJson   = await metricsRes.json()
        const objetivosJson = await objetivosRes.json()

        if (!Array.isArray(metricsJson)) return

        setMetrics(metricsJson)
        setObjetivos(objetivosJson ?? null)

        const avail = [...new Set(metricsJson.map((m: any) => Number(m.year)))]
          .filter((y): y is number => !Number.isNaN(y))
          .sort((a, b) => b - a)
        setYears(avail)

        if (year === 0 && periodsJson?.metrics?.latest) {
          setYear(periodsJson.metrics.latest.year)
          setSelectedMonth(0)
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [year])

  // ── Derived from metrics ──
  const globalYear = useMemo(() =>
    metrics
      .filter(m => Number(m.year) === year && getMediatorCode(m) === "GLOBAL")
      .sort((a, b) => Number(a.month) - Number(b.month)),
    [metrics, year]
  )

  const availableMonths = useMemo(() => globalYear.map(m => Number(m.month)), [globalYear])

  const effectiveMonth = useMemo(() => {
    if (selectedMonth && availableMonths.includes(selectedMonth)) return selectedMonth
    return availableMonths[availableMonths.length - 1] ?? 0
  }, [selectedMonth, availableMonths])

  const data         = useMemo(() => globalYear.find(m => Number(m.month) === effectiveMonth) ?? null, [globalYear, effectiveMonth])
  const previousData = useMemo(() => {
    if (!data) return null
    const idx = globalYear.findIndex(m => Number(m.month) === effectiveMonth)
    return idx > 0 ? globalYear[idx - 1] : null
  }, [globalYear, data, effectiveMonth])

  // ── Load production data when year/month changes ──
  useEffect(() => {
    if (!effectiveMonth) return
    fetch(`/api/production?year=${year}&month=${effectiveMonth}&medor=742776&medofis=TOTAL`)
      .then(r => r.json())
      .then(d => {
        setNvRows(Array.isArray(d.nv) ? d.nv : [])
        setVidaRows(Array.isArray(d.vida) ? d.vida : [])
      })
      .catch(console.error)
  }, [year, effectiveMonth])

  // ── Production groups ──
  const productionGroups = useMemo(() => {
    const nv = nvRows
    const v  = vidaRows

    // Particulares & Empresa: dynamically discover ramos from real data
    const partRows = buildLobRows(nv, "PARTICULARES", COLORS[0])
    const empRows  = buildLobRows(nv, "EMPRESAS",     COLORS[1])

    // Salud: always show Individual + Colectivo even if value=0
    const saludRows: ProdRow[] = [
      { name: "Individual", ...nvSubramo(nv, "SALUD", "SALUDIND"), color: COLORS[4], isHighlighted: false },
      { name: "Colectivo",  ...nvSubramo(nv, "SALUD", "SALUDCOL"), color: COLORS[4], isHighlighted: false },
      { name: "Total Salud", ...nvLob(nv, "SALUD"),                 color: COLORS[4], isHighlighted: true  },
    ]

    // Vida (Pure Protection): Individual + Colectivo — always show
    const vidaGrupo: ProdRow[] = [
      { name: "Individual", ...vidaByLob(v, "Pure Protection", "Individual"), color: COLORS[2], isHighlighted: false },
      { name: "Colectivo",  ...vidaByLob(v, "Pure Protection", "Colectivo"),  color: COLORS[2], isHighlighted: false },
      { name: "Total Vida", ...vidaByLob(v, "Pure Protection"),               color: COLORS[2], isHighlighted: true  },
    ]

    // Ahorro: GA + UL + Protection w/s
    const ahorroProd = ["General Account", "Unit Linked", "Protection w/s"] as const
    const ahorroAct  = ahorroProd.reduce((s, lob) => s + vidaByLob(v, lob).actual,   0)
    const ahorroAnt  = ahorroProd.reduce((s, lob) => s + vidaByLob(v, lob).anterior, 0)
    const ahorroRows: ProdRow[] = [
      { name: "General Account", ...vidaByLob(v, "General Account"), color: COLORS[3], isHighlighted: false },
      { name: "Unit Linked",     ...vidaByLob(v, "Unit Linked"),      color: COLORS[3], isHighlighted: false },
      { name: "Protection w/s",  ...vidaByLob(v, "Protection w/s"),   color: COLORS[3], isHighlighted: false },
      { name: "Total Ahorro", actual: ahorroAct, anterior: ahorroAnt, color: COLORS[3], isHighlighted: true },
    ]

    return {
      particulares: partRows,
      empresa:      empRows,
      salud:        saludRows,
      vida:         vidaGrupo,
      ahorro:       ahorroRows,
    }
  }, [nvRows, vidaRows])

  // ── Yearly & monthly GWP trend ──
  const yearlyData = useMemo(() => {
    const grouped: Record<number, any[]> = {}
    metrics.forEach(m => {
      if (getMediatorCode(m) !== "GLOBAL") return
      const y = Number(m.year)
      if (!grouped[y]) grouped[y] = []
      grouped[y].push(m)
    })
    return Object.entries(grouped)
      .map(([yr, arr]) => {
        const last = [...arr].sort((a, b) => Number(a.month) - Number(b.month)).pop()
        return { year: Number(yr), gwp: toNumber(last?.medofis?.gwp) }
      })
      .sort((a, b) => a.year - b.year)
  }, [metrics])

  const monthlyGwpData = useMemo(() =>
    globalYear.map(m => ({ mes: MONTHS[Number(m.month) - 1], gwp: toNumber(m.medofis?.gwp) })),
    [globalYear]
  )

  // ── Cartera pie data ──
  const carteraData = useMemo(() => {
    if (!data) return []
    return [
      { name: "Particulares", value: toNumber(data?.cartera?.particulares?.total) },
      { name: "Empresa",      value: toNumber(data?.cartera?.empresa?.total) },
      { name: "Salud",        value: toNumber(data?.cartera?.salud?.total) },
      { name: "Vida",         value: toNumber(data?.cartera?.vida?.individual) },
      { name: "Ahorro",       value: toNumber(data?.cartera?.vida?.ahorro) },
      { name: "PSC",          value: toNumber(data?.cartera?.psc?.total) },
    ].filter(d => d.value > 0)
  }, [data])

  const medofisCarteraData = useMemo(() => {
    if (!metrics.length || !effectiveMonth) return []
    return metrics
      .filter(m =>
        Number(m.year) === year &&
        Number(m.month) === effectiveMonth &&
        getMediatorCode(m) !== "GLOBAL" &&
        toNumber(m.medofis?.gwp) > 0
      )
      .map(m => ({ name: getMediatorCode(m), value: toNumber(m.medofis?.gwp) }))
      .sort((a, b) => b.value - a.value)
  }, [metrics, year, effectiveMonth])

  const titleDate = useMemo(() =>
    effectiveMonth ? `${MONTHS_FULL[effectiveMonth - 1]} ${year}` : "",
    [effectiveMonth, year]
  )

  const objRapel = useMemo(
    () => objetivos?.[year]?.rapelAnual ?? { crecimientoMin: 0, devolucionesMax: 2, saludMin: 8000, vidaMin: 8000 },
    [objetivos, year]
  )

  if (!data) {
    return (
      <div className="space-y-8">
        <Header title="Panel principal" subtitle="Cargando…" year={year} years={years}
          onYearChange={y => { setYear(y); setSelectedMonth(0) }}
          selectedMonth={selectedMonth} availableMonths={[]} onMonthChange={setSelectedMonth} />
        <div className="panel text-center text-slate-400 py-12">No hay datos para este año.</div>
      </div>
    )
  }

  const gwp          = toNumber(data?.medofis?.gwp)
  const renovacion   = toNumber(data?.medofis?.renovacionPct)
  const tasaNP       = toNumber(data?.medofis?.tasaNpPct)
  const crecimiento  = toNumber(data?.medofis?.crecimientoPct)
  const cor          = toNumber(data?.medofis?.cor)
  const devoluciones = toNumber(data?.medofis?.devolucionesPct)
  const siniestralidad = toNumber(data?.medofis?.siniestralidadSinIbnrPct)

  const prevGwp          = previousData ? toNumber(previousData?.medofis?.gwp) : null
  const prevRenovacion   = previousData ? toNumber(previousData?.medofis?.renovacionPct) : null
  const prevTasaNP       = previousData ? toNumber(previousData?.medofis?.tasaNpPct) : null
  const prevCrecimiento  = previousData ? toNumber(previousData?.medofis?.crecimientoPct) : null
  const prevCor          = previousData ? toNumber(previousData?.medofis?.cor) : null

  const prodSalud = toNumber(data?.produccion?.salud?.total)
  const prodVida  = toNumber(data?.produccion?.vida?.individual)

  return (
    <div className="space-y-8">
      <Header
        title="Panel principal"
        subtitle={`Agencia 742776 · ${titleDate}`}
        year={year} years={years}
        onYearChange={y => { setYear(y); setSelectedMonth(0) }}
        selectedMonth={selectedMonth} availableMonths={availableMonths} onMonthChange={setSelectedMonth}
      />

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi title="GWP"              value={fmtEuros(gwp)}           raw={gwp}          prevRaw={prevGwp}         subvalue={prevGwp != null ? `Ant: ${fmtEuros(prevGwp)}` : undefined}           icon={BadgeEuro}    type="money" />
        <Kpi title="Renovación"       value={fmtPct(renovacion)}      raw={renovacion}   prevRaw={prevRenovacion}  subvalue={prevRenovacion != null ? `Ant: ${fmtPct(prevRenovacion)}` : undefined}  icon={ShieldCheck}  type="renovacion" />
        <Kpi title="Tasa NP"          value={fmtPct(tasaNP)}          raw={tasaNP}       prevRaw={prevTasaNP}      subvalue={prevTasaNP != null ? `Ant: ${fmtPct(prevTasaNP)}` : undefined}         icon={TrendingUp}   type="tnp" />
        <Kpi title="Crecimiento"      value={fmtPct(crecimiento)}     raw={crecimiento}  prevRaw={prevCrecimiento} subvalue={prevCrecimiento != null ? `Ant: ${fmtPct(prevCrecimiento)}` : undefined} icon={Percent}      type="crecimiento" />
        <Kpi title="COR"              value={fmtPct(cor)}             raw={cor}          prevRaw={prevCor}         subvalue={prevCor != null ? `Ant: ${fmtPct(prevCor)}` : undefined}               icon={ArrowUpRight} type="cor" />
        <Kpi title="Siniest. IBNR"    value={fmtPct(siniestralidad)}  raw={siniestralidad} prevRaw={null}         subvalue="Total IARD"                                                             icon={AlertTriangle} type="siniestralidad" />
      </section>

      {/* Rapel */}
      <details open className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-panel">
        <summary className="cursor-pointer list-none px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#003A8F]" />
              <h3 className="text-lg font-semibold text-slate-900">Seguimiento del rapel anual</h3>
            </div>
            <span className="text-sm text-slate-400">Abrir / cerrar</span>
          </div>
        </summary>
        <div className="border-t border-slate-100 px-6 py-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <ProgressCard title="Crecimiento mínimo"  actual={crecimiento} objetivo={toNumber(objRapel.crecimientoMin)} mode="min" suffix="%" />
            <ProgressCard title="% PTE P.Adq máximo" actual={devoluciones} objetivo={toNumber(objRapel.devolucionesMax)} mode="max" suffix="%" />
            <ProgressCard title="Producción Salud"    actual={prodSalud}   objetivo={toNumber(objRapel.saludMin)} suffix="€" />
            <ProgressCard title="Producción Vida"     actual={prodVida}    objetivo={toNumber(objRapel.vidaMin)}  suffix="€" />
          </div>
        </div>
      </details>

      {/* Charts + Producción */}
      <section className="grid gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-1">

          {/* Composición cartera */}
          <div className="panel">
            <h3 className="font-semibold text-slate-900">
              Composición de cartera <span className="text-slate-400 font-normal text-sm">(GWP)</span>
            </h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={carteraData} dataKey="value" nameKey="name"
                    outerRadius={100} innerRadius={50} minAngle={2}
                    label={PieLabel} labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  >
                    {carteraData.map((e, i) => <Cell key={e.name} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtEuros(v)} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cartera por MEDOFIS */}
          {medofisCarteraData.length > 0 && (
            <div className="panel">
              <h3 className="font-semibold text-slate-900">
                Cartera por MEDOFIS <span className="text-slate-400 font-normal text-sm">(GWP)</span>
              </h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={medofisCarteraData} dataKey="value" nameKey="name"
                      outerRadius={88} innerRadius={44} minAngle={2}
                      label={PieLabel} labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                    >
                      {medofisCarteraData.map((_: any, i: number) => (
                        <Cell key={i} fill={MEDOFIS_COLORS[i % MEDOFIS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtEuros(v)} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Evolución + comparativa */}
          <div className="panel space-y-6">
            {monthlyGwpData.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900">Evolución mensual GWP</h3>
                <p className="mt-1 text-xs text-slate-400">Acumulado YTD por mes · {year}</p>
                <div className="mt-3 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyGwpData} margin={{ top:4, right:12, left:0, bottom:0 }}>
                      <CartesianGrid strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={42}
                        tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1000 ? `${Math.round(v/1000)}k` : `${v}`} />
                      <Tooltip formatter={(v: number) => fmtEuros(v)} />
                      <Line type="monotone" dataKey="gwp" stroke="#003A8F" strokeWidth={2.5}
                        dot={{ r: 4, fill: "#003A8F", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      {effectiveMonth > 0 && (
                        <ReferenceLine x={MONTHS[effectiveMonth - 1]} stroke="#F6D88A" strokeWidth={2}
                          strokeDasharray="4 2"
                          label={{ value: "actual", position: "top", fontSize: 10, fill: "#92400e" }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-slate-900">Comparativa anual</h3>
              <p className="mt-1 text-xs text-slate-400">GWP acumulado último dato por año</p>
              <div className="mt-3 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData} margin={{ top:4, right:12, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={42}
                      tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1000 ? `${Math.round(v/1000)}k` : `${v}`} />
                    <Tooltip formatter={(v: number) => fmtEuros(v)} />
                    <Line type="monotone" dataKey="gwp" stroke="#003A8F" strokeWidth={2.5}
                      dot={{ r: 4, fill: "#003A8F", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Análisis de producción */}
        <div className="panel xl:col-span-2">
          <h3 className="font-semibold text-slate-900">
            Análisis de producción <span className="text-slate-400 font-normal text-sm">(GWPNP)</span>
          </h3>
          <div className="mt-4 space-y-3">
            <ProductionTable title="Particulares"  data={productionGroups.particulares} />
            <ProductionTable title="Empresa"       data={productionGroups.empresa} />
            <ProductionTable title="Salud"         data={productionGroups.salud} />
            <ProductionTable title="Vida" data={productionGroups.vida} />
            <ProductionTable title="Ahorro"        data={productionGroups.ahorro} />
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  title, subtitle, year, years, onYearChange, selectedMonth, availableMonths, onMonthChange,
}: {
  title: string; subtitle: string
  year: number; years: number[]; onYearChange: (y: number) => void
  selectedMonth: number; availableMonths: number[]; onMonthChange: (m: number) => void
}) {
  return (
    <div className="panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {availableMonths.length > 0 && (
          <select value={selectedMonth} onChange={e => onMonthChange(Number(e.target.value))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none">
            <option value={0}>Último disponible</option>
            {availableMonths.map(m => <option key={m} value={m}>{MONTHS_FULL[m - 1]}</option>)}
          </select>
        )}
        <select value={year} onChange={e => onYearChange(Number(e.target.value))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function Kpi({
  title, value, subvalue, raw, prevRaw, icon: Icon, type,
}: {
  title: string; value: string; subvalue?: string
  raw: number; prevRaw?: number | null; icon: any
  type: "money"|"renovacion"|"tnp"|"crecimiento"|"cor"|"siniestralidad"
}) {
  function color() {
    if (type === "renovacion")   return raw < 70 ? "text-red-600" : raw <= 90 ? "text-orange-500" : "text-green-600"
    if (type === "tnp")          return raw < 10 ? "text-red-600" : raw < 15  ? "text-orange-500" : "text-green-600"
    if (type === "crecimiento")  return raw < 0  ? "text-red-600" : raw <= 5  ? "text-orange-500" : "text-green-600"
    if (type === "cor")          return raw > 100 ? "text-red-600" : "text-green-600"
    if (type === "siniestralidad") return raw > 80 ? "text-red-600" : raw > 60 ? "text-orange-500" : "text-green-600"
    return "text-[#003A8F]"
  }

  function trend() {
    if (prevRaw == null) return null
    const up = type === "cor" || type === "siniestralidad" ? raw < prevRaw : raw > prevRaw
    if (raw === prevRaw) return <span className="text-slate-300 text-xs">–</span>
    return up
      ? <span className="text-green-600 text-xs">▲</span>
      : <span className="text-red-600 text-xs">▼</span>
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-panel flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <Icon size={16} className="text-slate-400 shrink-0" />
      </div>
      <p className={`text-2xl font-bold leading-none ${color()}`}>{value}</p>
      {subvalue && (
        <p className="flex items-center gap-1 text-xs text-slate-400">
          {trend()} <span>{subvalue}</span>
        </p>
      )}
    </div>
  )
}

// ─── Production Table ─────────────────────────────────────────────────────────

function VarBadge({ actual, anterior }: { actual: number; anterior: number }) {
  if (anterior === 0 && actual === 0) return <span className="text-slate-300 text-xs text-right block">—</span>
  if (anterior === 0) return (
    <span className="inline-flex justify-end">
      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5">NUEVO</span>
    </span>
  )
  const pct = ((actual - anterior) / Math.abs(anterior)) * 100
  const up  = pct >= 0
  const color = up ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"
  const arrow = up ? "▲" : "▼"
  return (
    <span className="inline-flex justify-end">
      <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${color}`}>
        {arrow} {Math.abs(pct).toFixed(1)}%
      </span>
    </span>
  )
}

function ProductionTable({ title, data }: {
  title: string
  data: Array<{ name: string; actual: number; anterior: number; color: string; isHighlighted?: boolean }>
}) {
  const accentColor = data[0]?.color ?? "#003A8F"
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
      <div className="p-3">
      <h4 className="font-semibold text-sm text-slate-800 mb-2 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
        {title}
      </h4>
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 px-2">
        <span>Ramo</span>
        <span className="text-right">Año ant.</span>
        <span className="text-right">Actual</span>
        <span className="text-right">Var. %</span>
      </div>
      <div className="space-y-0.5">
        {data.map((item, i) => (
          <div key={i} className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-2 py-1.5 rounded-lg transition-colors ${
            item.isHighlighted
              ? "bg-slate-50 border border-slate-200"
              : "border border-transparent hover:bg-slate-50"
          }`}>
            <span
              className={`text-sm truncate ${item.isHighlighted ? "font-bold" : "font-medium text-slate-700"}`}
              style={{ color: item.isHighlighted ? item.color : undefined }}
            >
              {item.name}
            </span>
            <span className="text-right text-xs text-slate-400">{fmtEuros(item.anterior)}</span>
            <span className={`text-right text-sm font-semibold ${item.isHighlighted ? "text-slate-900" : "text-slate-800"}`}>
              {fmtEuros(item.actual)}
            </span>
            <VarBadge actual={item.actual} anterior={item.anterior} />
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
