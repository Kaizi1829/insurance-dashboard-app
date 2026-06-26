import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get("year")

  let query = supabaseServer.from("cuadro_mando").select("*").order("year").order("month")
  if (year) query = query.eq("year", Number(year))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { year, month, tipo, datos } = body

  const { error } = await supabaseServer.from("cuadro_mando").upsert(
    { year: Number(year), month: Number(month), tipo: tipo ?? "real", datos: datos ?? {} },
    { onConflict: "year,month,tipo" }
  )
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
