import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function query(table: string, params: Record<string, string>) {
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function GET() {
  const [argosRaw, metricsRaw] = await Promise.all([
    query('argos_no_vida', { select: 'year,month', order: 'year.desc,month.desc' }),
    query('metrics', { select: 'year,month', mediator_code: 'eq.GLOBAL', order: 'year.desc,month.desc' }),
  ])

  const dedup = (rows: any[]) => {
    const seen = new Map<string, { year: number; month: number }>()
    for (const r of rows ?? []) {
      const k = `${r.year}-${r.month}`
      if (!seen.has(k)) seen.set(k, { year: Number(r.year), month: Number(r.month) })
    }
    return Array.from(seen.values()).sort((a, b) => b.year - a.year || b.month - a.month)
  }

  const argosPeriods  = dedup(argosRaw)
  const metricsPeriods = dedup(metricsRaw)

  return NextResponse.json(
    {
      argos:   { periods: argosPeriods,   latest: argosPeriods[0]   ?? null },
      metrics: { periods: metricsPeriods, latest: metricsPeriods[0] ?? null },
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  )
}
