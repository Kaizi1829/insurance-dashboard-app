import { NextResponse } from "next/server"

let metrics: any[] = []

export async function GET() {
  return NextResponse.json(metrics)
}

export async function POST(request: Request) {
  try {
    const newData = await request.json()

    const index = metrics.findIndex(
      (m) =>
        m.year === newData.year &&
        m.month === newData.month &&
        m.mediatorCode === newData.mediatorCode
    )

    if (index >= 0) {
      metrics[index] = newData
    } else {
      metrics.push(newData)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error guardando:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}