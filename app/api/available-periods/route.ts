import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET() {
  // Períodos disponibles en argos (para página ARGOS)
  const { data: argosData } = await supabaseServer
    .from("argos_no_vida")
    .select("year, month")
    .order("year", { ascending: false })
    .order("month", { ascending: false })

  // Períodos disponibles en metrics (para Home, Medofis, Seguimiento)
  const { data: metricsData } = await supabaseServer
    .from("metrics")
    .select("year, month")
    .eq("mediator_code", "GLOBAL")
    .order("year", { ascending: false })
    .order("month", { ascending: false })

  // Deduplica y construye lista única para argos
  const argosSet = new Map<string, { year: number; month: number }>()
  for (const row of argosData ?? []) {
    const key = `${row.year}-${row.month}`
    if (!argosSet.has(key)) argosSet.set(key, { year: row.year, month: row.month })
  }
  const argosPeriods = Array.from(argosSet.values()).sort(
    (a, b) => b.year - a.year || b.month - a.month
  )

  // Deduplica para metrics
  const metricsSet = new Map<string, { year: number; month: number }>()
  for (const row of metricsData ?? []) {
    const key = `${row.year}-${row.month}`
    if (!metricsSet.has(key)) metricsSet.set(key, { year: row.year, month: row.month })
  }
  const metricsPeriods = Array.from(metricsSet.values()).sort(
    (a, b) => b.year - a.year || b.month - a.month
  )

  // El último período disponible en cada fuente
  const latestArgos = argosPeriods[0] ?? null
  const latestMetrics = metricsPeriods[0] ?? null

  return NextResponse.json({
    argos: { periods: argosPeriods, latest: latestArgos },
    metrics: { periods: metricsPeriods, latest: latestMetrics },
  })
}
