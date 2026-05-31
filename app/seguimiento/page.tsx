"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ShieldCheck,
  Briefcase,
  HeartHandshake,
  PiggyBank,
  Wallet,
  Heart,
} from "lucide-react"

const years = [2024, 2025, 2026, 2027]

type Estado = "cumple" | "en_curso" | "no_cumple" | "devenga"

type SummaryCardProps = {
  title: string
  value: string
  helper?: string
}

type ProgressItem = {
  label: string
  meta: number | string
  real: number | string
  cumplimiento: number
  falta: number | string
  estado: Estado
  isPercent?: boolean
}

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

function getEstado(
  real: number,
  meta: number,
  options?: { inverse?: boolean; devengaLabel?: boolean }
): Estado {
  const inverse = options?.inverse ?? false
  const devengaLabel = options?.devengaLabel ?? false

  if (!inverse) {
    if (real >= meta) return devengaLabel ? "devenga" : "cumple"
    if (real > 0 || meta > 0) return "en_curso"
    return "no_cumple"
  }

  if (real <= meta) return devengaLabel ? "devenga" : "cumple"
  if (real > 0) return "en_curso"
  return "no_cumple"
}

function getCumplimiento(real: number, meta: number, inverse = false) {
  if (!inverse) {
    if (meta === 0) {
      return real >= 0 ? 100 : 0
    }

    return Math.max(0, Math.min(Math.round((real / meta) * 100), 999))
  }

  if (meta === 0) return 0
  if (real <= meta) return 100
  if (real <= 0) return 100

  return Math.max(0, Math.min(Math.round((meta / real) * 100), 999))
}

function getFalta(real: number, meta: number, inverse = false) {
  if (!inverse) {
    if (meta === 0) {
      return real >= 0 ? 0 : Math.abs(real)
    }

    return Math.max(0, meta - real)
  }

  if (meta === 0) return 0
  return real <= meta ? 0 : real - meta
}

function getQuarterKey(month: number) {
  if (month >= 1 && month <= 4) return "1"
  if (month >= 5 && month <= 8) return "2"
  return "3"
}

function getQuarterLabel(month: number) {
  if (month >= 1 && month <= 4) return "1Q | Enero - Abril"
  if (month >= 5 && month <= 8) return "2Q | Mayo - Agosto"
  return "3Q | Septiembre - Diciembre"
}

export default function SeguimientoObjetivosPage() {
  const [year, setYear] = useState(0)
  const [metrics, setMetrics] = useState<any[]>([])
  const [objetivos, setObjetivos] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        // Auto-detectar el último año con datos si aún no hay año seleccionado
        let activeYear = year
        if (!activeYear) {
          const periodsRes = await fetch("/api/available-periods")
          const periodsJson = await periodsRes.json()
          activeYear = periodsJson?.metrics?.latest?.year ?? 2026
          setYear(activeYear)
        }

        const [metricsRes, objetivosRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch(`/api/objetivos?year=${activeYear}`),
        ])

        const metricsJson = await metricsRes.json()
        const objetivosJson = await objetivosRes.json()

        setMetrics(Array.isArray(metricsJson) ? metricsJson : [])
        setObjetivos(objetivosJson ?? null)
      } catch (error) {
        console.error("Error cargando seguimiento:", error)
        setMetrics([])
        setObjetivos(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [year])

  const yearsFromData = useMemo(() => {
    const fromMetrics = metrics
      .map((m: any) => Number(m.year))
      .filter((y: number) => !Number.isNaN(y))

    const combined = [...new Set([...years, ...fromMetrics])].sort((a, b) => b - a)
    return combined
  }, [metrics])

  const globalYear = useMemo(() => {
    return metrics
      .filter(
        (m: any) =>
          Number(m.year) === year &&
          (m.mediatorCode === "GLOBAL" || m.mediator_code === "GLOBAL")
      )
      .sort((a: any, b: any) => Number(a.month) - Number(b.month))
  }, [metrics, year])

  const lastMetric = globalYear.length > 0 ? globalYear[globalYear.length - 1] : null
  const lastMonth = Number(lastMetric?.month ?? 0)

  const quarterActiveLabel = lastMonth ? getQuarterLabel(lastMonth) : "1Q | Enero - Abril"
  const quarterActiveKey = lastMonth ? getQuarterKey(lastMonth) : "1"

  const rapelAnualItems: ProgressItem[] = useMemo(() => {
    if (!lastMetric || !objetivos) return []

    const crecimientoMeta = toNumber(objetivos?.rapelAnual?.crecimientoMin)
    const devolucionesMeta = toNumber(objetivos?.rapelAnual?.devolucionesMax)
    const saludMeta = toNumber(objetivos?.rapelAnual?.saludMin)
    const vidaMeta = toNumber(objetivos?.rapelAnual?.vidaMin)

    const crecimientoReal = toNumber(lastMetric?.medofis?.crecimientoPct)
    const devolucionesReal = toNumber(lastMetric?.medofis?.devolucionesPct)
    const saludReal = toNumber(lastMetric?.produccion?.particulares?.salud)
    const vidaReal = toNumber(lastMetric?.produccion?.vida?.individual)

    return [
      {
        label: "Crecimiento mínimo",
        meta: crecimientoMeta,
        real: crecimientoReal,
        cumplimiento: getCumplimiento(crecimientoReal, crecimientoMeta),
        falta: getFalta(crecimientoReal, crecimientoMeta),
        estado: getEstado(crecimientoReal, crecimientoMeta),
        isPercent: true,
      },
      {
        label: "% devueltos máximo",
        meta: devolucionesMeta,
        real: devolucionesReal,
        cumplimiento: getCumplimiento(devolucionesReal, devolucionesMeta, true),
        falta: getFalta(devolucionesReal, devolucionesMeta, true),
        estado: getEstado(devolucionesReal, devolucionesMeta, {
          inverse: true,
        }),
        isPercent: true,
      },
      {
        label: "Producción Salud",
        meta: saludMeta,
        real: saludReal,
        cumplimiento: getCumplimiento(saludReal, saludMeta),
        falta: getFalta(saludReal, saludMeta),
        estado: getEstado(saludReal, saludMeta),
      },
      {
        label: "Producción Vida",
        meta: vidaMeta,
        real: vidaReal,
        cumplimiento: getCumplimiento(vidaReal, vidaMeta),
        falta: getFalta(vidaReal, vidaMeta),
        estado: getEstado(vidaReal, vidaMeta),
      },
    ]
  }, [lastMetric, objetivos])

  const gradosItems: ProgressItem[] = useMemo(() => {
    if (!lastMetric || !objetivos) return []

    const saludMeta = toNumber(objetivos?.grados?.salud)
    const empresaMeta = toNumber(objetivos?.grados?.empresa)
    const vidaMeta = toNumber(objetivos?.grados?.vida)
    const pscMeta = toNumber(objetivos?.grados?.psc)

    const saludReal = toNumber(lastMetric?.produccion?.particulares?.salud)
    const empresaReal = toNumber(lastMetric?.produccion?.empresa?.total)
    const vidaReal = toNumber(lastMetric?.produccion?.vida?.individual)
    const pscReal = toNumber(lastMetric?.produccion?.psc?.total)

    return [
      {
        label: "Salud",
        meta: saludMeta,
        real: saludReal,
        cumplimiento: getCumplimiento(saludReal, saludMeta),
        falta: getFalta(saludReal, saludMeta),
        estado: getEstado(saludReal, saludMeta),
      },
      {
        label: "Empresa",
        meta: empresaMeta,
        real: empresaReal,
        cumplimiento: getCumplimiento(empresaReal, empresaMeta),
        falta: getFalta(empresaReal, empresaMeta),
        estado: getEstado(empresaReal, empresaMeta),
      },
      {
        label: "Vida",
        meta: vidaMeta,
        real: vidaReal,
        cumplimiento: getCumplimiento(vidaReal, vidaMeta),
        falta: getFalta(vidaReal, vidaMeta),
        estado: getEstado(vidaReal, vidaMeta),
      },
      {
        label: "PSC",
        meta: pscMeta,
        real: pscReal,
        cumplimiento: getCumplimiento(pscReal, pscMeta),
        falta: getFalta(pscReal, pscMeta),
        estado: getEstado(pscReal, pscMeta),
      },
    ]
  }, [lastMetric, objetivos])

  const rapelNuevaProduccionItemsByQuarter: Record<string, ProgressItem[]> = useMemo(() => {
    const emptyQuarter = (label: string): ProgressItem[] => {
      const quarterKey = label.startsWith("1Q") ? "1" : label.startsWith("2Q") ? "2" : "3"
      const quarterGoals = objetivos?.rapelCuatrimestral?.[quarterKey] ?? {}

      return [
        {
          label: "Salud",
          meta: toNumber(quarterGoals?.salud),
          real: 0,
          cumplimiento: 0,
          falta: toNumber(quarterGoals?.salud),
          estado: "no_cumple",
        },
        {
          label: "PSC",
          meta: toNumber(quarterGoals?.psc),
          real: 0,
          cumplimiento: 0,
          falta: toNumber(quarterGoals?.psc),
          estado: "no_cumple",
        },
        {
          label: "Empresa",
          meta: toNumber(quarterGoals?.empresa),
          real: 0,
          cumplimiento: 0,
          falta: toNumber(quarterGoals?.empresa),
          estado: "no_cumple",
        },
        {
          label: "Particulares",
          meta: toNumber(quarterGoals?.particulares),
          real: 0,
          cumplimiento: 0,
          falta: toNumber(quarterGoals?.particulares),
          estado: "no_cumple",
        },
        {
          label: "Ahorro",
          meta: toNumber(quarterGoals?.ahorro),
          real: 0,
          cumplimiento: 0,
          falta: toNumber(quarterGoals?.ahorro),
          estado: "no_cumple",
        },
        {
          label: "Vida",
          meta: toNumber(quarterGoals?.vida),
          real: 0,
          cumplimiento: 0,
          falta: toNumber(quarterGoals?.vida),
          estado: "no_cumple",
        },
      ]
    }

    const result: Record<string, ProgressItem[]> = {
      "1Q | Enero - Abril": emptyQuarter("1Q | Enero - Abril"),
      "2Q | Mayo - Agosto": emptyQuarter("2Q | Mayo - Agosto"),
      "3Q | Septiembre - Diciembre": emptyQuarter("3Q | Septiembre - Diciembre"),
    }

    if (!lastMetric || !objetivos || !lastMonth) return result

    const quarterGoals = objetivos?.rapelCuatrimestral?.[quarterActiveKey] ?? {}
    const activeItems: ProgressItem[] = [
      {
        label: "Salud",
        meta: toNumber(quarterGoals?.salud),
        real: toNumber(lastMetric?.produccion?.particulares?.salud),
        cumplimiento: getCumplimiento(
          toNumber(lastMetric?.produccion?.particulares?.salud),
          toNumber(quarterGoals?.salud)
        ),
        falta: getFalta(
          toNumber(lastMetric?.produccion?.particulares?.salud),
          toNumber(quarterGoals?.salud)
        ),
        estado: getEstado(
          toNumber(lastMetric?.produccion?.particulares?.salud),
          toNumber(quarterGoals?.salud),
          { devengaLabel: true }
        ),
      },
      {
        label: "PSC",
        meta: toNumber(quarterGoals?.psc),
        real: toNumber(lastMetric?.produccion?.psc?.total),
        cumplimiento: getCumplimiento(
          toNumber(lastMetric?.produccion?.psc?.total),
          toNumber(quarterGoals?.psc)
        ),
        falta: getFalta(
          toNumber(lastMetric?.produccion?.psc?.total),
          toNumber(quarterGoals?.psc)
        ),
        estado: getEstado(
          toNumber(lastMetric?.produccion?.psc?.total),
          toNumber(quarterGoals?.psc),
          { devengaLabel: true }
        ),
      },
      {
        label: "Empresa",
        meta: toNumber(quarterGoals?.empresa),
        real: toNumber(lastMetric?.produccion?.empresa?.total),
        cumplimiento: getCumplimiento(
          toNumber(lastMetric?.produccion?.empresa?.total),
          toNumber(quarterGoals?.empresa)
        ),
        falta: getFalta(
          toNumber(lastMetric?.produccion?.empresa?.total),
          toNumber(quarterGoals?.empresa)
        ),
        estado: getEstado(
          toNumber(lastMetric?.produccion?.empresa?.total),
          toNumber(quarterGoals?.empresa),
          { devengaLabel: true }
        ),
      },
      {
        label: "Particulares",
        meta: toNumber(quarterGoals?.particulares),
        real: toNumber(lastMetric?.produccion?.particulares?.total),
        cumplimiento: getCumplimiento(
          toNumber(lastMetric?.produccion?.particulares?.total),
          toNumber(quarterGoals?.particulares)
        ),
        falta: getFalta(
          toNumber(lastMetric?.produccion?.particulares?.total),
          toNumber(quarterGoals?.particulares)
        ),
        estado: getEstado(
          toNumber(lastMetric?.produccion?.particulares?.total),
          toNumber(quarterGoals?.particulares),
          { devengaLabel: true }
        ),
      },
      {
        label: "Ahorro",
        meta: toNumber(quarterGoals?.ahorro),
        real: toNumber(lastMetric?.produccion?.vida?.ahorro),
        cumplimiento: getCumplimiento(
          toNumber(lastMetric?.produccion?.vida?.ahorro),
          toNumber(quarterGoals?.ahorro)
        ),
        falta: getFalta(
          toNumber(lastMetric?.produccion?.vida?.ahorro),
          toNumber(quarterGoals?.ahorro)
        ),
        estado: getEstado(
          toNumber(lastMetric?.produccion?.vida?.ahorro),
          toNumber(quarterGoals?.ahorro),
          { devengaLabel: true }
        ),
      },
      {
        label: "Vida",
        meta: toNumber(quarterGoals?.vida),
        real: toNumber(lastMetric?.produccion?.vida?.individual),
        cumplimiento: getCumplimiento(
          toNumber(lastMetric?.produccion?.vida?.individual),
          toNumber(quarterGoals?.vida)
        ),
        falta: getFalta(
          toNumber(lastMetric?.produccion?.vida?.individual),
          toNumber(quarterGoals?.vida)
        ),
        estado: getEstado(
          toNumber(lastMetric?.produccion?.vida?.individual),
          toNumber(quarterGoals?.vida),
          { devengaLabel: true }
        ),
      },
    ]

    result[quarterActiveLabel] = activeItems
    return result
  }, [lastMetric, objetivos, lastMonth, quarterActiveKey, quarterActiveLabel])

  const resumen = useMemo(() => {
    const gradosConseguidos = gradosItems.filter((item) => item.cumplimiento >= 100).length
    const rapelAnualCumplidos = rapelAnualItems.filter((item) => item.estado === "cumple").length

    const activos = rapelNuevaProduccionItemsByQuarter[quarterActiveLabel] ?? []
    const hayDatos = activos.some((item) => Number(item.real) > 0)
    const rapelesConseguidos = hayDatos
      ? activos.filter((item) => item.estado === "devenga").length
      : 0
    const total = hayDatos ? activos.length : 0

    return {
      grados: {
        title: "Grados",
        value: `${gradosConseguidos} de ${gradosItems.length}`,
        helper: "Grados conseguidos",
      },
      rapelAnual: {
        title: "Rapel anual",
        value: `${rapelAnualCumplidos} de ${rapelAnualItems.length}`,
        helper: "Objetivos cumplidos",
      },
      rapelNuevaProduccion: {
        title: "Rapel nueva producción",
        value: `${rapelesConseguidos} de ${total}`,
        helper: "Rápeles conseguidos",
      },
    }
  }, [gradosItems, rapelAnualItems, rapelNuevaProduccionItemsByQuarter, quarterActiveLabel])
const monthNames = [
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

const monthName = lastMonth ? monthNames[lastMonth - 1] : "-"
  
  if (loading) {
  return (
    <div className="panel flex justify-between items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold">Seguimiento de objetivos</h1>
        <p className="mt-2 text-sm text-slate-500">Panel de seguimiento</p>
      </div>

      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="border rounded-lg px-3 py-2"
      >
        {yearsFromData.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}

  if (!lastMetric || !objetivos) {
    return (
      <div className="space-y-8">
  <div className="panel flex justify-between items-center gap-4">
    <div>
      <h1 className="text-2xl font-bold">Seguimiento de objetivos</h1>
      <p className="mt-2 text-sm text-slate-500">Panel de seguimiento</p>
    </div>

    <select
      value={year}
      onChange={(e) => setYear(Number(e.target.value))}
      className="border rounded-lg px-3 py-2"
    >
      {yearsFromData.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  </div>

        <div className="panel text-sm text-slate-500">
          No hay datos de GLOBAL para ese año.
        </div>
      </div>
    )
  }

  return (
  <div className="space-y-8">
    <div className="panel flex justify-between items-center gap-4">
  <div>
    <h1 className="text-2xl font-bold">Seguimiento de objetivos</h1>
    <p className="mt-2 text-sm text-slate-500">
      Panel de seguimiento — {monthName} {year}
    </p>
  </div>

  <select
    value={year}
    onChange={(e) => setYear(Number(e.target.value))}
    className="border rounded-lg px-3 py-2"
  >
    {yearsFromData.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>
</div>

      <div className="grid gap-4 md:grid-cols-3">
  <SummaryCard
    title={resumen.rapelAnual.title}
    value={resumen.rapelAnual.value}
    helper={resumen.rapelAnual.helper}
  />
  <SummaryCard
    title={resumen.rapelNuevaProduccion.title}
    value={resumen.rapelNuevaProduccion.value}
    helper={resumen.rapelNuevaProduccion.helper}
  />
  <SummaryCard
    title={resumen.grados.title}
    value={resumen.grados.value}
    helper={resumen.grados.helper}
  />
</div>

      <Section title="Rapel anual" defaultOpen={false}>
        <div className="space-y-4 bg-white">
          {rapelAnualItems.map((item) => (
            <ObjectiveRow key={item.label} item={item} />
          ))}
        </div>
      </Section>

      <Section title="Rapel nueva producción" defaultOpen={false}>
        <div className="space-y-6">
          {Object.entries(rapelNuevaProduccionItemsByQuarter).map(([quarter, items]) => (
            <SubSection
              key={quarter}
              title={quarter}
              defaultOpen={quarter === quarterActiveLabel}
            >
              <div className="space-y-4 bg-white">
                {items.map((item) => (
                  <ObjectiveRow
                    key={`${quarter}-${item.label}`}
                    item={item}
                    showIcon
                    compactTitle
                  />
                ))}
              </div>
            </SubSection>
          ))}
        </div>
      </Section>

      <Section title="Grados" defaultOpen={false}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {gradosItems.map((item) => (
            <GradoCircleCard key={item.label} item={item} />
          ))}
        </div>
      </Section>
    </div>
  )
}

function SummaryCard({ title, value, helper }: SummaryCardProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-panel">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-[#003A8F]">{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-400">{helper}</p> : null}
    </div>
  )
}

function ObjectiveRow({
  item,
  showIcon = false,
  compactTitle = false,
}: {
  item: ProgressItem
  showIcon?: boolean
  compactTitle?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="grid gap-4 md:grid-cols-6">
        <MetricBlock
          label={compactTitle ? "" : "Objetivo"}
          value={item.label}
          icon={showIcon ? getRapelIcon(item.label) : null}
        />
        <MetricBlock label="Meta" value={formatValue(item.meta, item.isPercent)} />
        <MetricBlock label="Real" value={formatValue(item.real, item.isPercent)} />
        <MetricBlock label="% cumplido" value={`${Math.min(Number(item.cumplimiento), 999)}%`} />
        <MetricBlock label="Falta" value={formatValue(item.falta, item.isPercent)} />
        <div>
          <p className="text-xs font-medium text-slate-400">Estado</p>
          <div className="mt-2">
            <StatusBadge estado={item.estado} />
          </div>
        </div>
      </div>
    </div>
  )
}

function GradoCircleCard({ item }: { item: ProgressItem }) {
  const progress = Math.max(0, Math.min(Number(item.cumplimiento), 100))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (progress / 100) * circumference
  const color = getGradoColor(item.label)

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-semibold text-slate-900">{item.label}</p>
        </div>
        <StatusBadge estado={item.estado} />
      </div>

      <div className="mt-5 flex items-center justify-center">
        <div className="relative h-28 w-28">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-slate-900">{progress}%</p>
            <p className="text-[11px] text-slate-400">avance</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <MetricInline label="Objetivo" value={formatValue(item.meta)} />
        <MetricInline label="Real" value={formatValue(item.real)} />
        <MetricInline label="Falta" value={formatValue(item.falta)} />
      </div>
    </div>
  )
}

function MetricBlock({
  label,
  value,
  icon = null,
}: {
  label: string
  value: string
  icon?: ReactNode
}) {
  return (
    <div>
      {label ? <p className="text-xs font-medium text-slate-400">{label}</p> : null}

      <div className={`${label ? "mt-2" : ""} flex items-center gap-2`}>
        {icon}
        <p className={`text-sm font-semibold ${!label ? "text-[#003A8F]" : "text-slate-800"}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

function MetricInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function StatusBadge({ estado }: { estado: Estado }) {
  const styles: Record<Estado, string> = {
    cumple: "bg-green-50 text-green-700 border-green-200",
    en_curso: "bg-amber-50 text-amber-700 border-amber-200",
    no_cumple: "bg-red-50 text-red-700 border-red-200",
    devenga: "bg-green-50 text-green-700 border-green-200",
  }

  const labels: Record<Estado, string> = {
    cumple: "Cumple",
    en_curso: "En curso",
    no_cumple: "No cumple",
    devenga: "Devenga",
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[estado]}`}
    >
      {labels[estado]}
    </span>
  )
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-panel"
    >
      <summary className="cursor-pointer list-none px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <span className="text-sm text-slate-400">Abrir / cerrar</span>
        </div>
      </summary>

      <div className="space-y-6 border-t border-slate-100 px-6 py-6">{children}</div>
    </details>
  )
}

function SubSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      className="rounded-2xl border border-slate-200 bg-white"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-semibold text-slate-800">{title}</h4>
          <span className="text-xs text-slate-400">Desplegar</span>
        </div>
      </summary>

      <div className="border-t border-slate-200 px-4 py-4">{children}</div>
    </details>
  )
}

function getGradoColor(label: string) {
  const colors: Record<string, string> = {
    Salud: "#F6D88A",
    Empresa: "#9CC3FF",
    PSC: "#C8A2FF",
    Vida: "#9FE3B0",
  }

  return colors[label] ?? "#003A8F"
}

function getRapelIcon(label: string) {
  const commonClass = "h-4 w-4 text-slate-500"

  const icons: Record<string, ReactNode> = {
    Salud: <ShieldCheck className={commonClass} />,
    PSC: <HeartHandshake className={commonClass} />,
    Empresa: <Briefcase className={commonClass} />,
    Particulares: <Wallet className={commonClass} />,
    Ahorro: <PiggyBank className={commonClass} />,
    Vida: <Heart className={commonClass} />,
  }

  return icons[label] ?? null
}

function formatValue(value: number | string, isPercent = false) {
  const n = Number(value)

  if (Number.isNaN(n)) {
    return isPercent ? "0%" : "0 €"
  }

  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)

  if (isPercent) {
    const [integerPart, decimalPart] = abs.toFixed(2).split(".")
    const integerWithDots = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    let formatted = sign + integerWithDots

    if (decimalPart !== "00") {
      const trimmedDecimals = decimalPart.replace(/0+$/, "")
      formatted = `${sign}${integerWithDots},${trimmedDecimals}`
    }

    return `${formatted}%`
  }

  const [integerPart] = abs.toFixed(0).split(".")
  const integerWithDots = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${sign}${integerWithDots} €`
}