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
} from "recharts"

import ProgressCard from "./components/ProgressCard"

const COLORS = [
  "#F6D88A", // Particulares
  "#9CC3FF", // Empresa
  "#F6A6A6", // Vida
  "#C8A2FF", // Ahorro
  "#9FE3B0", // PSC
]

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

function toNumber(value: any) {
  if (value === undefined || value === null || value === "") return 0
  if (typeof value === "number") return value

  let str = value.toString().trim().replace("€", "").replace(/\s/g, "")

  const hasComma = str.includes(",")
  const hasDot = str.includes(".")

  if (hasComma && hasDot) {
    str = str.replace(/\./g, "").replace(",", ".")
  } else if (hasComma) {
    str = str.replace(",", ".")
  }

  str = str.replace(/[^0-9.-]/g, "")
  return Number(str) || 0
}

function formatNumberEs(value: any, decimals = 2) {
  const n = toNumber(value)
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)

  const [integerPart, decimalPart] = abs.toFixed(decimals).split(".")
  const integerWithDots = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  if (!decimalPart || decimalPart === "00") {
    return sign + integerWithDots
  }

  const trimmedDecimals = decimalPart.replace(/0+$/, "")
  return trimmedDecimals
    ? `${sign}${integerWithDots},${trimmedDecimals}`
    : sign + integerWithDots
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

function percentLabel({ percent }: any) {
  if (!percent || percent < 0.04) return ""
  return `${(percent * 100).toFixed(0)}%`
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

export default function HomePage() {
  const [year, setYear] = useState(0)
  const [metrics, setMetrics] = useState<any[]>([])
  const [data, setData] = useState<any>(null)
  const [previousData, setPreviousData] = useState<any>(null)
  const [years, setYears] = useState<number[]>([])
  const [objetivos, setObjetivos] = useState<any>(null)
  const [titleDate, setTitleDate] = useState("")

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
        if (latestMetrics && year === 0) {
          setYear(latestMetrics.year)
        }

        const metricsJson = await metricsRes.json()
        const objetivosJson = await objetivosRes.json()

        if (!Array.isArray(metricsJson)) {
          setMetrics([])
          setData(null)
          setPreviousData(null)
          setYears([])
          setObjetivos(null)
          setTitleDate("")
          return
        }

        setMetrics(metricsJson)

        const availableYears = [...new Set(metricsJson.map((m: any) => Number(m.year)))]
          .filter((y): y is number => !Number.isNaN(y))
          .sort((a, b) => b - a)

        setYears(availableYears)

        const globalYear = metricsJson
          .filter(
            (m: any) =>
              Number(m.year) === year &&
              getMediatorCode(m) === "GLOBAL"
          )
          .sort((a: any, b: any) => Number(a.month) - Number(b.month))

        if (globalYear.length > 0) {
          const last = globalYear[globalYear.length - 1]
          const previous =
            globalYear.length > 1 ? globalYear[globalYear.length - 2] : null

          setData(last)
          setPreviousData(previous)

          const monthNumber = Number(last.month)
          const monthLabel =
            monthNumber >= 1 && monthNumber <= 12
              ? MONTHS[monthNumber - 1]
              : ""

          setTitleDate(monthLabel ? `${monthLabel} ${last.year}` : `${last.year}`)
        } else {
          setData(null)
          setPreviousData(null)
          setTitleDate("")
        }

        setObjetivos(objetivosJson?.[year] ?? null)
      } catch (error) {
        console.error("Error cargando home:", error)
        setMetrics([])
        setData(null)
        setPreviousData(null)
        setYears([])
        setObjetivos(null)
        setTitleDate("")
      }
    }

    load()
  }, [year])

  const yearlyData = useMemo(() => {
    if (!metrics.length) return []

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
        const sorted = [...arr].sort(
          (a: any, b: any) => Number(a.month) - Number(b.month)
        )

        const last = sorted[sorted.length - 1]

        return {
          year: Number(yearKey),
          gwp: toNumber(last?.medofis?.gwp),
        }
      })
      .sort((a, b) => a.year - b.year)
  }, [metrics])

  const productionGroups = useMemo(() => {
    if (!data) return { particulares: [], empresa: [], salud: [], vidaAhorro: [], psc: [] }

    // anterior viene de produccion.anterior (GWPNPA del Argos)
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
        { name: "Flotas",           actual: act("empresa.flotas"),    anterior: ant("empresa.flotas"),    color: COLORS[1], isHighlighted: false },
        { name: "RC Empresa",       actual: act("empresa.rc"),        anterior: ant("empresa.rc"),        color: COLORS[1], isHighlighted: false },
        { name: "Comercio",         actual: act("empresa.comercio"),  anterior: ant("empresa.comercio"),  color: COLORS[1], isHighlighted: false },
        { name: "Oficina",          actual: act("empresa.oficina"),   anterior: ant("empresa.oficina"),   color: COLORS[1], isHighlighted: false },
        { name: "Industria",        actual: act("empresa.industria"), anterior: ant("empresa.industria"), color: COLORS[1], isHighlighted: false },
        { name: "Total Empresa",    actual: act("empresa.total"),     anterior: ant("empresa.total"),     color: COLORS[1], isHighlighted: true  },
      ],
      salud: [
        { name: "Salud",            actual: act("salud.total"),       anterior: ant("salud.total"),       color: COLORS[4], isHighlighted: true  },
      ],
      vidaAhorro: [
        { name: "Vida Individual",  actual: act("vida.individual"),   anterior: ant("vida.individual"),   color: COLORS[2], isHighlighted: false },
        { name: "Ahorro",           actual: act("vida.ahorro"),       anterior: ant("vida.ahorro"),       color: COLORS[3], isHighlighted: true  },
      ],
      psc: [
        { name: "PSC",              actual: act("psc.total"),         anterior: ant("psc.total"),         color: COLORS[4], isHighlighted: true  },
      ],
    }
  }, [data])

  if (!data) {
    return (
      <div className="space-y-8">
        <div className="panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Home</h1>
            <p className="mt-2 text-sm text-slate-500">
              Panel principal de la agencia · {titleDate}
            </p>
          </div>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="panel text-center text-slate-400">
          No hay datos de GLOBAL para este año.
        </div>
      </div>
    )
  }

  const gwp = toNumber(data?.medofis?.gwp)
  const renovacion = toNumber(data?.medofis?.renovacionPct)
  const tasaNP = toNumber(data?.medofis?.tasaNpPct)
  const crecimiento = toNumber(data?.medofis?.crecimientoPct)
  const cor = toNumber(data?.medofis?.cor)
  const devoluciones = toNumber(data?.medofis?.devolucionesPct)
  const siniestralidad = toNumber(data?.medofis?.siniestralidadSinIbnrPct)

  const prevGwp = previousData ? toNumber(previousData?.medofis?.gwp) : null
  const prevRenovacion = previousData
    ? toNumber(previousData?.medofis?.renovacionPct)
    : null
  const prevTasaNP = previousData
    ? toNumber(previousData?.medofis?.tasaNpPct)
    : null
  const prevCrecimiento = previousData
    ? toNumber(previousData?.medofis?.crecimientoPct)
    : null
  const prevCor = previousData ? toNumber(previousData?.medofis?.cor) : null

  const prodSalud = toNumber(data?.produccion?.salud?.total)
  const prodVida = toNumber(data?.produccion?.vida?.individual)

  const carteraData = [
    { name: "Particulares", value: toNumber(data?.cartera?.particulares?.total) },
    { name: "Empresa",      value: toNumber(data?.cartera?.empresa?.total) },
    { name: "Salud",        value: toNumber(data?.cartera?.salud?.total) },
    { name: "Vida",         value: toNumber(data?.cartera?.vida?.individual) },
    { name: "Ahorro",       value: toNumber(data?.cartera?.vida?.ahorro) },
    { name: "PSC",          value: toNumber(data?.cartera?.psc?.total) },
  ].filter((item) => item.value > 0)

  const objRapel = objetivos?.rapelAnual || {
    crecimientoMin: 0,
    devolucionesMax: 2,
    saludMin: 8000,
    vidaMin: 8000,
  }

  return (
    <div className="space-y-10">
      <div className="panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Home</h1>
          <p className="mt-2 text-sm text-slate-500">
            Panel principal de la agencia · {titleDate}
          </p>
        </div>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
        <Kpi
          title="GWP"
          value={formatEuros(gwp)}
          raw={gwp}
          previousRaw={prevGwp}
          subvalue={prevGwp !== null ? `Anterior: ${formatEuros(prevGwp)}` : "Anterior: -"}
          icon={BadgeEuro}
          type="money"
        />

        <Kpi
          title="Renovación"
          value={formatPercent(renovacion)}
          raw={renovacion}
          previousRaw={prevRenovacion}
          subvalue={
            prevRenovacion !== null
              ? `Anterior: ${formatPercent(prevRenovacion)}`
              : "Anterior: -"
          }
          icon={ShieldCheck}
          type="renovacion"
        />

        <Kpi
          title="Tasa NP"
          value={formatPercent(tasaNP)}
          raw={tasaNP}
          previousRaw={prevTasaNP}
          subvalue={
            prevTasaNP !== null
              ? `Anterior: ${formatPercent(prevTasaNP)}`
              : "Anterior: -"
          }
          icon={TrendingUp}
          type="tnp"
        />

        <Kpi
          title="Crecimiento"
          value={formatPercent(crecimiento)}
          raw={crecimiento}
          previousRaw={prevCrecimiento}
          subvalue={
            prevCrecimiento !== null
              ? `Anterior: ${formatPercent(prevCrecimiento)}`
              : "Anterior: -"
          }
          icon={Percent}
          type="crecimiento"
        />

        <Kpi
          title="COR"
          value={formatPercent(cor)}
          raw={cor}
          previousRaw={prevCor}
          subvalue={prevCor !== null ? `Anterior: ${formatPercent(prevCor)}` : "Anterior: -"}
          icon={ArrowUpRight}
          type="cor"
        />
        <Kpi
          title="Siniest. sin IBNR"
          value={formatPercent(siniestralidad)}
          raw={siniestralidad}
          previousRaw={null}
          subvalue="Total IARD"
          icon={AlertTriangle}
          type="siniestralidad"
        />
      </section>

      <details
        open
        className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-panel"
      >
        <summary className="cursor-pointer list-none px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#003A8F]" />
              <h3 className="text-lg font-semibold text-slate-900">
                Seguimiento del rapel anual
              </h3>
            </div>
            <span className="text-sm text-slate-400">Abrir / cerrar</span>
          </div>
        </summary>

        <div className="border-t border-slate-100 px-6 py-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <ProgressCard
              title="Crecimiento mínimo"
              actual={crecimiento}
              objetivo={toNumber(objRapel.crecimientoMin)}
              mode="min"
              suffix="%"
            />

            <ProgressCard
              title="% PTE P.Adq máximo"
              actual={devoluciones}
              objetivo={toNumber(objRapel.devolucionesMax)}
              mode="max"
              suffix="%"
            />

            <ProgressCard
              title="Producción Salud"
              actual={prodSalud}
              objetivo={toNumber(objRapel.saludMin)}
              suffix="€"
            />

            <ProgressCard
              title="Producción Vida"
              actual={prodVida}
              objetivo={toNumber(objRapel.vidaMin)}
              suffix="€"
            />
          </div>
        </div>
      </details>

      <section className="grid gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-1">
          <div className="panel">
            <div>
              <h3 className="font-semibold text-slate-900">
                Composición de cartera <span className="text-slate-400">(GWP)</span>
              </h3>
            </div>

            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={carteraData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={108}
                    innerRadius={52}
                    minAngle={2}
                    label={percentLabel}
                    labelLine={false}
                  >
                    {carteraData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>

                  <Tooltip formatter={(v: number) => formatEuros(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div>
              <h3 className="font-semibold text-slate-900">
                Comparativa anual
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                GWP a cierre de diciembre
              </p>
            </div>

            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={yearlyData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) {
                        return `${(value / 1000000).toFixed(1)}M`
                      }
                      if (value >= 1000) {
                        return `${Math.round(value / 1000)}k`
                      }
                      return `${value}`
                    }}
                  />
                  <Tooltip formatter={(v: number) => formatEuros(v)} />
                  <Line
                    type="monotone"
                    dataKey="gwp"
                    stroke="#003A8F"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#003A8F", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#003A8F" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="panel xl:col-span-2">
          <div>
            <h3 className="font-semibold text-slate-900">
              Análisis de producción <span className="text-slate-400">(GWPNP)</span>
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            <ProductionTable title="Particulares" data={productionGroups.particulares} />
            <ProductionTable title="Empresa" data={productionGroups.empresa} />
            <ProductionTable title="Salud" data={productionGroups.salud} />
            <ProductionTable title="Vida y Ahorro" data={productionGroups.vidaAhorro} />
            <ProductionTable title="PSC" data={productionGroups.psc} />
          </div>
        </div>
      </section>
    </div>
  )
}

function Kpi({
  title,
  value,
  subvalue,
  raw,
  previousRaw,
  icon: Icon,
  type,
}: {
  title: string
  value: string
  subvalue?: string
  raw: number
  previousRaw?: number | null
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

  function renderArrow() {
    if (previousRaw === undefined || previousRaw === null) return null
    if (raw > previousRaw) return <span className="text-green-600">▲</span>
    if (raw < previousRaw) return <span className="text-red-600">▼</span>
    return <span className="text-slate-300">•</span>
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <Icon size={20} className="text-[#003A8F]" />
      </div>

      <p className={`mt-3 text-3xl font-bold ${getColor()}`}>{value}</p>

      {subvalue ? (
        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          {renderArrow()}
          <span>{subvalue}</span>
        </p>
      ) : null}
    </div>
  )
}

function ProductionTable({
  title,
  data,
}: {
  title: string
  data: Array<{
    name: string
    actual: number
    anterior: number
    color: string
    isHighlighted?: boolean
  }>
}) {
  function getVariation(actual: number, anterior: number) {
    return actual - anterior
  }

  function getVariationColor(value: number) {
    if (value > 0) return "text-green-600"
    if (value < 0) return "text-red-600"
    return "text-slate-400"
  }

  function renderVariation(value: number) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : ""
    return `${sign}${formatEuros(Math.abs(value))}`
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
      <h4 className="font-semibold text-slate-800 mb-2">{title}</h4>

      <div className="grid grid-cols-4 text-[11px] font-medium text-slate-400 mb-1 px-2">
        <span>Ramo</span>
        <span className="text-right">GWPNPA (ant.)</span>
        <span className="text-right">GWPNP (act.)</span>
        <span className="text-right">Var.</span>
      </div>

      <div className="space-y-0.5">
        {data.map((item, i) => {
          const variation = getVariation(item.actual, item.anterior)

          return (
            <div
              key={i}
              className={`grid grid-cols-4 items-center px-2 py-1.5 rounded-lg border ${
                item.isHighlighted
                  ? "bg-white border-slate-200"
                  : "border-transparent hover:bg-white/70"
              }`}
            >
              <span
                className={`text-sm ${
                  item.isHighlighted
                    ? "font-semibold"
                    : "font-medium"
                }`}
                style={{
                  color: item.isHighlighted ? item.color : "#334155",
                }}
              >
                {item.name}
              </span>

              <span className="text-right text-sm text-slate-900">
                {formatEuros(item.anterior)}
              </span>

              <span className="text-right text-sm text-slate-900">
                {formatEuros(item.actual)}
              </span>

              <span
                className={`text-right text-sm font-semibold ${getVariationColor(variation)}`}
              >
                {renderVariation(variation)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}