import { NextRequest, NextResponse } from "next/server"
import { getObjetivosByYear, objetivosPorAno } from "@/lib/objetivos"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const yearParam = searchParams.get("year")

    if (yearParam) {
      const year = Number(yearParam)

      if (isNaN(year)) {
        return NextResponse.json(
          { ok: false, error: "El año no es válido" },
          { status: 400 }
        )
      }

      return NextResponse.json(getObjetivosByYear(year))
    }

    return NextResponse.json(objetivosPorAno)
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error al leer objetivos" },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "Los objetivos están definidos en código y no se guardan desde la web.",
    },
    { status: 405 }
  )
}