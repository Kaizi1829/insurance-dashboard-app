import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

// Este endpoint lo llama Vercel Cron cada día para mantener activo Supabase.
// El plan gratuito pausa proyectos tras 7 días sin actividad.
export async function GET() {
  try {
    const { count, error } = await supabaseServer
      .from("metrics")
      .select("*", { count: "exact", head: true })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      message: "Supabase activo ✓",
      rows: count,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
