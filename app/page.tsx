"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BadgeEuro,
  ShieldCheck,
  TrendingUp,
  Percent,
  ArrowUpRight,
  Target,
  AlertTriangle,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import ProgressCard from "./components/ProgressCard"

const COLORS = [
  "#F6D88A", // Particulares
  "#9CC3FF", // Empresa
  "#F6A6A6", // Vida
  "#C8A2FF", // Ahorro
  "#9FE3B0", // PSC
  "#FDB97D", // Salud extra
]

const MEDOFIS_COLORS = ["#003A8F", "#F6D88A", "#9CC3FF", "#9FE3B0", "#C8A2FF", "#F6A6A6"]

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]
const MONTHS_FULL = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

function toNumber(value: any) {
  if (value === undefined || value === null || value === "") return 0
  if (typeof value === "number") return value
  let str = value.toString().trim().replace("€", "").replace(/\s/g, "")
  const hasComma = str.includes(",")
  const hasDot = str.includes(".")
  if (hasComma && hasDot) str = str.replace(/\./g, "").replace(",", ".")
  else if (hasComma) str = str.replace(",", ".")
  str = str.replace(/[^0-9.-]/g, "")
  return Number(str) || 0
}

function formatNumberEs(value: any, decimals = 2) {
  const n = toNumber(value)
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)
  const [integerPart, decimalPart] = abs.toFixed(decimals).split(".")
  const integerWithDots = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  if (!decimalPart || decimalPart === "00") return sign + integerWithDots
  const trimmedDecimals = decimalPart.replace(/0+$/, "")
  return trimmedDecimals ? `${sign}${integerWithDots},${trimmedDecimals}` : sign + integerWithDots
}

function formatEuros(value: any) {
  return `${formatNumberEs(value, 0)} €`
}

function formatPercent(value: any) {
  return `${formatNumberEs(value)}%`
}

function getMediatorCode(metric: any) {
  return metric?.mediator_code ?? metric?.mediatorCode ?? ""
}

function getValueByPath(source: any, path: string) {
  if (!source) return 0
  const parts = path.split(".")
  let current = source
  for (const part of parts) {
    if (current == null) return 0
    current = current[part]
  }
  return toNumber(current)
}

// Custom pie label — renders outside the arc to avoid overlap
function PieLabel({ cx, cy, midAngle, outerRadius, percent }: any) {
  if (!percent || percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 32
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x} y={y}
      fill="#475569"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

export default function HomePage() {
  const [year, setYear] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [metrics, setMetrics] = useState<any[]>([])
  const [years, setYears] = useState<number[]>([])
  const [objetivos, setObjetivos] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const [metricsRes, objetivosRes, periodsRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/objetivos"),
          fetch("/api/available-periods"),
        ])
        const periodsJson = await periodsRes.json()
        const latestMetrics = periodsJson?.metrics?.latest
        const metricsJson = await metricsRes.json()
        const objetivosJson = await objetivosRes.json()

        if (!Array.isArray(metricsJson)) {
          setMetrics([])
          setYears([])
          setObjetivos(null)
          return
        }

        setMetrics(metricsJson)
        setObjetivos(objetivosJson ?? null)

        const availableYears = [...new Set(metricsJson.map((m: any) => Number(m.year)))]
          .filter((y): y is number => !Number.isNaN(y))
          .sort((a, b) => b - a)
        setYears(availableYears)

        if (year === 0 && latestMetrics) {
          setYear(latestMetrics.year)
          setSelectedMonth(0)
        }
      } catch (error) {
        console.error("Error cargando home:", error)
      }
    }
    load()
  }, [year])

  // All GLOBAL rows for the selected year, sorted by month
  const globalYear = useMemo(() => {
    return metrics
      .filter((m: any) => Number(m.year) === year && getMediatorCode(m) === "GLOBAL")
      .sort((a: any, b: any) => Number(a.month) - Number(b.month))
  }, [metrics, year])

  const availableMonths = useMemo(() => globalYear.map((m: any) => Number(m.month)), [globalYear])

  // effectiveMonth: user-selected or last available
  const effectiveMonth = useMemo(() => {
    if (selectedMonth && availableMonths.includes(selectedMonth)) return selectedMonth
    return availableMonths[availableMonths.length - 1] ?? 0
  }, [selectedMonth, availableMonths])

  const data = useMemo(
    () => globalYear.find((m: any) => Number(m.month) === effectiveMonth) ?? null,
    [globalYear, effectiveMonth]
  )

  const previousData = useMemo(() => {
    if (!data) return null
    const idx = globalYear.findIndex((m: any) => Number(m.month) === effectiveMonth)
    return idx > 0 ? globalYear[idx - 1] : null
  }, [globalYear, data, effectiveMonth])

  // Yearly GWP trend (last month of each year)
  const yearlyData = useMemo(() => {
    const grouped: Record<number, any[]> = {}
    metrics.forEach((m: any) => {
      if (getMediatorCode(m) !== "GLOBAL") return
      const y = Number(m.year)
      if (Number.isNaN(y)) return
      if (!grouped[y]) grouped[y] = []
      grouped[y].push(m)
    })
    return Object.entries(grouped)
      .map(([yearKey, arr]) => {
        const sorted = [...arr].sort((a: any, b: any) => Number(a.month) - Number(b.month))
        const last = sorted[sorted.length - 1]
        return { year: Number(yearKey), gwp: toNumber(last?.medofis?.gwp) }
      })
      .sort((a, b) => a.year - b.year)
  }, [metrics])

  // Monthly GWP trend for selected year
  const monthlyGwpData = useMemo(() => {
    return globalYear.map((m: any) => ({
      mes: MONTHS[Number(m.month) - 1],
      gwp: toNumber(m.medofis?.gwp),
    }))
  }, [globalYear])

  const productionGroups = useMemo(() => {
    if (!data) return { particulares: [], empresa: [], salud: [], vidaAhorro: [], psc: [] }
    const ant = (path: string) => getValueByPath(data, `produccion.anterior.${path}`)
    const act = (path: string) => getValueByPath(data, `produccion.${path}`)
    return {
      particulares: [
        { name: "Auto",             actual: act("particulares.auto"),        anterior: ant("particulares.auto"),        color: COLORS[0], isHighlighted: false },
        { name: "Hogar",            actual: act("particulares.hogar"),       anterior: ant("particulares.hogar"),       color: COLORS[0], isHighlighted: false },
        { name: "Decesos",          actual: act("particulares.decesos"),     anterior: ant("particulares.decesos"),     color: COLORS[0], isHighlighted: false },
        { name: "RC",               actual: act("particulares.rc"),          anterior: ant("particulares.rc"),          color: COLORS[0], isHighlighted: false },
        { name: "Comunidades",      actual: act("particulares.comunidades"), anterior: ant("particulares.comunidades"), color: COLORS[0], isHighlighted: false },
        { name: "Total Particulares", actual: act("particulares.total"),     anterior: ant("particulares.total"),       color: COLORS[0], isHighlighted: true  },
      ],
      empresa: [
        { name: "Flotas",        actual: act("empresa.flotas"),    anterior: ant("empresa.flotas"),    color: COLORS[1], isHighlighted: false },
        { name: "RC Empresa",    actual: act("empresa.rc"),        anterior: ant("empresa.rc"),        color: COLORS[1], isHighlighted: false },
        { name: "Comercio",      actual: act("empresa.comercio"),  anterior: ant("empresa.comercio"),  color: COLORS[1], isHighlighted: false },
        { name: "Oficina",       actual: act("empresa.oficina"),   anterior: ant("empresa.oficina"),   color: COLORS[1], isHighlighted: false },
        { name: "Industria",     actual: act("empresa.industria"), anterior: ant("empresa.industria"), color: COLORS[1], isHighlighted: false },
        { name: "Total Empresa", actual: act("empresa.total"),     anterior: ant("empresa.total"),     color: COLORS[1], isHighlighted: true  },
      ],
      salud: [
        { name: "Salud", actual: act("salud.total"), anterior: ant("salud.total"), color: COLORS[4], isHighlighted: true },
      ],
      vidaAhorro: [
        { name: "Vida Individual", actual: act("vida.individual"), anterior: ant("vida.individual"), color: COLORS[2], isHighlighted: false },
        { name: "Ahorro",          actual: act("vida.ahorro"),     anterior: ant("vida.ahorro"),     color: COLORS[3], isHighlighted: true  },
      ],
      psc: [
        { name: "PSC", actual: act("psc.total"), anterior: ant("psc.total"), color: COLORS[4], isHighlighted: true },
      ],
    }
  }, [data])

  // Cartera pie data
  const carteraData = useMemo(() => {
    if (!data) return []
    return [
      { name: "Particulares", value: toNumber(data?.cartera?.particulares?.total) },
      { name: "Empresa",      value: toNumber(data?.cartera?.empresa?.total) },
      { name: "Salud",        value: toNumber(data?.cartera?.salud?.total) },
      { name: "Vida",         value: toNumber(data?.cartera?.vida?.individual) },
      { name: "Ahorro",       value: toNumber(data?.cartera?.vida?.ahorro) },
      { name: "PSC",          value: toNumber(data?.cartera?.psc?.total) },
    ].filter((item) => item.value > 0)
  }, [data])

  // Cartera por MEDOFIS
  const medofisCarteraData = useMemo(() => {
    if (!metrics.length || !data) return []
    return metrics
      .filter((m: any) =>
        Number(m.year) === year &&
        Number(m.month) === effectiveMonth &&
        getMediatorCode(m) !== "GLOBAL" &&
        toNumber(m.medofis?.gwp) > 0
      )
      .map((m: any) => ({
        name: getMediatorCode(m),
        value: toNumber(m.medofis?.gwp),
      }))
      .sort((a: any, b: any) => b.value - a.value)
  }, [metrics, year, effectiveMonth, data])

  const titleDate = useMemo(() => {
    if (!effectiveMonth) return ""
    return `${MONTHS_FULL[effectiveMonth - 1]} ${year}`
  }, [effectiveMonth, year])

  const objRapel = useMemo(
    () => objetivos?.[year]?.rapelAnual ?? { crecimientoMin: 0, devolucionesMax: 2, saludMin: 8000, vidaMin: 8000 },
    [objetivos, year]
  )

  if (!data) {
    return (
      <div className="space-y-8">
        <Header
          title="Panel principal"
          subtitle="Cargando datos…"
          year={year}
          years={years}
          onYearChange={(y) => { setYear(y); setSelectedMonth(0) }}
          selectedMonth={selectedMonth}
          availableMonths={[]}
          onMonthChange={setSelectedMonth}
        />
        <div className="panel text-center text-slate-400 py-12">
          No hay datos de GLOBAL para este año.
        </div>
      </div>
    )
  }

  const gwp       = toNumber(data?.medofis?.gwp)
  const renovacion  = toNumber(data?.medofis?.renovacionPct)
  const tasaNP    = toNumber(data?.medofis?.tasaNpPct)
  const crecimiento = toNumber(data?.medofis?.crecimientoPct)
  const cor       = toNumber(data?.medofis?.cor)
  const devoluciones = toNumber(data?.medofis?.devolucionesPct)
  const siniestralidad = toNumber(data?.medofis?.siniestralidadSinIbnrPct)

  const prevGwp       = previousData ? toNumber(previousData?.medofis?.gwp) : null
  const prevRenovacion  = previousData ? toNumber(previousData?.medofis?.renovacionPct) : null
  const prevTasaNP    = previousData ? toNumber(previousData?.medofis?.tasaNpPct) : null
  const prevCrecimiento = previousData ? toNumber(previousData?.medofis?.crecimientoPct) : null
  const prevCor       = previousData ? toNumber(previousData?.medofis?.cor) : null

  const prodSalud = toNumber(data?.produccion?.salud?.total)
  const prodVida  = toNumber(data?.produccion?.vida?.individual)

  return (
    <div className="space-y-8">
      <Header
        title="Panel principal"
        subtitle={`Agencia 742776 · ${titleDate}`}
        year={year}
        years={years}
        onYearChange={(y) => { setYear(y); setSelectedMonth(0) }}
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        onMonthChange={setSelectedMonth}
      />

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi title="GWP"            value={formatEuros(gwp)}            raw={gwp}          prevRaw={prevGwp}          subvalue={prevGwp != null ? `Mes ant.: ${formatEuros(prevGwp)}` : undefined}      icon={BadgeEuro}     type="money" />
        <Kpi title="Renovación"     value={formatPercent(renovacion)}   raw={renovacion}   prevRaw={prevRenovacion}   subvalue={prevRenovacion != null ? `Mes ant.: ${formatPercent(prevRenovacion)}` : undefined}   icon={ShieldCheck}   type="renovacion" />
        <Kpi title="Tasa NP"        value={formatPercent(tasaNP)}       raw={tasaNP}       prevRaw={prevTasaNP}       subvalue={prevTasaNP != null ? `Mes ant.: ${formatPercent(prevTasaNP)}` : undefined}        icon={TrendingUp}    type="tnp" />
        <Kpi title="Crecimiento"    value={formatPercent(crecimiento)}  raw={crecimiento}  prevRaw={prevCrecimiento}  subvalue={prevCrecimiento != null ? `Mes ant.: ${formatPercent(prevCrecimiento)}` : undefined} icon={Percent}       type="crecimiento" />
        <Kpi title="COR"            value={formatPercent(cor)}          raw={cor}          prevRaw={prevCor}          subvalue={prevCor != null ? `Mes ant.: ${formatPercent(prevCor)}` : undefined}           icon={ArrowUpRight}  type="cor" />
        <Kpi title="Siniest. sin IBNR" value={formatPercent(siniestralidad)} raw={siniestralidad} prevRaw={null} subvalue="Total IARD" icon={AlertTriangle} type="siniestralidad" />
      </section>

      {/* Rapel anual */}
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
            <ProgressCard title="Crecimiento mínimo"    actual={crecimiento} objetivo={toNumber(objRapel.crecimientoMin)} mode="min" suffix="%" />
            <ProgressCard title="% PTE P.Adq máximo"   actual={devoluciones} objetivo={toNumber(objRapel.devolucionesMax)} mode="max" suffix="%" />
            <ProgressCard title="Producción Salud"      actual={prodSalud}   objetivo={toNumber(objRapel.saludMin)} suffix="€" />
            <ProgressCard title="Producción Vida"       actual={prodVida}    objetivo={toNumber(objRapel.vidaMin)}  suffix="€" />
          </div>
        </div>
      </details>

      {/* Charts + Producción */}
      <section className="grid gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-1">

          {/* Composición de cartera */}
          <div className="panel">
            <h3 className="font-semibold text-slate-900">
              Composición de cartera <span className="text-slate-400 font-normal text-sm">(GWP)</span>
            </h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={carteraData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    innerRadius={50}
                    minAngle={2}
                    label={PieLabel}
                    labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  >
                    {carteraData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatEuros(v)} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
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
                    <Pie
                      data={medofisCarteraData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      innerRadius={44}
                      minAngle={3}
                      label={PieLabel}
                      labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                    >
                      {medofisCarteraData.map((_: any, index: number) => (
                        <Cell key={index} fill={MEDOFIS_COLORS[index % MEDOFIS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatEuros(v)} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Comparativa — mensual + anual */}
          <div className="panel space-y-6">
            {monthlyGwpData.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900">Evolución mensual GWP</h3>
                <p className="mt-1 text-xs text-slate-400">Acumulado YTD por mes · {year}</p>
                <div className="mt-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyGwpData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v/1000)}k` : `${v}`} width={40} />
                      <Tooltip formatter={(v: number) => formatEuros(v)} labelFormatter={(l) => `Mes: ${l}`} />
                      <Line type="monotone" dataKey="gwp" stroke="#003A8F" strokeWidth={2.5} dot={{ r: 4, fill: "#003A8F", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      {effectiveMonth > 0 && monthlyGwpData[effectiveMonth - 1] && (
                        <ReferenceLine x={MONTHS[effectiveMonth - 1]} stroke="#F6D88A" strokeWidth={2} strokeDasharray="4 2" label={{ value: "hoy", position: "top", fontSize: 10, fill: "#92400e" }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-slate-900">Comparativa anual GWP</h3>
              <p className="mt-1 text-xs text-slate-400">Último dato disponible por año</p>
              <div className="mt-4 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v/1000)}k` : `${v}`} width={40} />
                    <Tooltip formatter={(v: number) => formatEuros(v)} />
                    <Line type="monotone" dataKey="gwp" stroke="#003A8F" strokeWidth={2.5} dot={{ r: 4, fill: "#003A8F", strokeWidth: 0 }} activeDot={{ r: 6 }} />
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
            <ProductionTable title="Vida y Ahorro" data={productionGroups.vidaAhorro} />
            <ProductionTable title="PSC"           data={productionGroups.psc} />
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({
  title,
  subtitle,
  year,
  years,
  onYearChange,
  selectedMonth,
  availableMonths,
  onMonthChange,
}: {
  title: string
  subtitle: string
  year: number
  years: number[]
  onYearChange: (y: number) => void
  selectedMonth: number
  availableMonths: number[]
  onMonthChange: (m: number) => void
}) {
  return (
    <div className="panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {availableMonths.length > 0 && (
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
          >
            <option value={0}>Último disponible</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{MONTHS_FULL[m - 1]}</option>
            ))}
          </select>
        )}
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function Kpi({
  title,
  value,
  subvalue,
  raw,
  prevRaw,
  icon: Icon,
  type,
}: {
  title: string
  value: string
  subvalue?: string
  raw: number
  prevRaw?: number | null
  icon: any
  type: "money" | "renovacion" | "tnp" | "crecimiento" | "cor" | "siniestralidad"
}) {
  function getColor() {
    if (type === "renovacion") {
      if (raw < 70) return "text-red-600"
      if (raw <= 90) return "text-orange-500"
      return "text-green-600"
    }
    if (type === "tnp") {
      if (raw < 10) return "text-red-600"
      if (raw < 15) return "text-orange-500"
      return "text-green-600"
    }
    if (type === "crecimiento") {
      if (raw < 0) return "text-red-600"
      if (raw <= 5) return "text-orange-500"
      return "text-green-600"
    }
    if (type === "cor") {
      if (raw > 100) return "text-red-600"
      return "text-green-600"
    }
    if (type === "siniestralidad") {
      if (raw > 80) return "text-red-600"
      if (raw > 60) return "text-orange-500"
      return "text-green-600"
    }
    return "text-[#003A8F]"
  }

  function renderTrend() {
    if (prevRaw == null) return null
    const improved =
      type === "cor" || type === "siniestralidad"
        ? raw < prevRaw
        : raw > prevRaw
    if (raw === prevRaw) return <span className="text-slate-300 text-xs">–</span>
    return improved
      ? <span className="text-green-600 text-xs font-semibold">▲</span>
      : <span className="text-red-600 text-xs font-semibold">▼</span>
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-panel flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <Icon size={16} className="text-slate-400 shrink-0" />
      </div>
      <p className={`text-2xl font-bold leading-none ${getColor()}`}>{value}</p>
      {subvalue ? (
        <p className="flex items-center gap-1 text-xs text-slate-400">
          {renderTrend()}
          <span>{subvalue}</span>
        </p>
      ) : null}
    </div>
  )
}

// ─── Production Table ─────────────────────────────────────────────────────────

function ProductionTable({
  title,
  data,
}: {
  title: string
  data: Array<{ name: string; actual: number; anterior: number; color: string; isHighlighted?: boolean }>
}) {
  function renderVariation(actual: number, anterior: number) {
    const v = actual - anterior
    const sign = v > 0 ? "+" : v < 0 ? "−" : ""
    const color = v > 0 ? "text-green-600" : v < 0 ? "text-red-600" : "text-slate-400"
    return <span className={`font-semibold ${color}`}>{sign}{formatEuros(Math.abs(v))}</span>
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
      <h4 className="font-semibold text-sm text-slate-700 mb-2">{title}</h4>
      <div className="grid grid-cols-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 px-2">
        <span>Ramo</span>
        <span className="text-right">Ant.</span>
        <span className="text-right">Act.</span>
        <span className="text-right">Var.</span>
      </div>
      <div className="space-y-0.5">
        {data.map((item, i) => (
          <div
            key={i}
            className={`grid grid-cols-4 items-center px-2 py-1.5 rounded-lg border ${
              item.isHighlighted ? "bg-white border-slate-200" : "border-transparent hover:bg-white/70"
            }`}
          >
            <span
              className={`text-sm ${item.isHighlighted ? "font-semibold" : "font-medium text-slate-700"}`}
              style={{ color: item.isHighlighted ? item.color : undefined }}
            >
              {item.name}
            </span>
            <span className="text-right text-sm text-slate-600">{formatEuros(item.anterior)}</span>
            <span className="text-right text-sm text-slate-900 font-medium">{formatEuros(item.actual)}</span>
            <span className="text-right text-sm">{renderVariation(item.actual, item.anterior)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
