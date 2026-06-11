import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const res = await fetch(`${SUPABASE_URL}/rest/v1/metrics?order=year,month`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    console.error("metrics fetch error", res.status, await res.text())
    return NextResponse.json([])
  }

  const raw = await res.json()
  const formatted = raw.map((m: any) => ({
    year: m.year,
    month: m.month,
    monthNumber: m.month,
    mediatorCode: m.mediator_code,
    medofis: m.medofis,
    cartera: m.cartera,
    produccion: m.produccion,
  }))

  return NextResponse.json(formatted)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      year,
      month,
      mediatorCode,
      medofis,
      cartera,
      produccion,
    } = body

    const { data: existing } = await supabaseServer
      .from("metrics")
      .select("*")
      .eq("year", Number(year))
      .eq("month", Number(month))
      .eq("mediator_code", mediatorCode)
      .maybeSingle()

    const payload = {
      year: Number(year),
      month: Number(month),
      mediator_code: mediatorCode,
      medofis: medofis ?? existing?.medofis ?? {},
      cartera: cartera ?? existing?.cartera ?? {},
      produccion: produccion ?? existing?.produccion ?? {},
    }

    const { error } = await supabaseServer
      .from("metrics")
      .upsert(payload, {
        onConflict: "year,month,mediator_code",
      })

    if (error) {
      console.error(error)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}