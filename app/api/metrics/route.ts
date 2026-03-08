import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const filePath = path.join(process.cwd(), "data", "metrics.json")

function readMetrics() {

  try {

    const data = fs.readFileSync(filePath, "utf8")

    if (!data) return []

    const parsed = JSON.parse(data)

    if (!Array.isArray(parsed)) return []

    return parsed

  } catch {

    return []

  }

}



export async function GET() {

  const metrics = readMetrics()

  return NextResponse.json(metrics)

}



export async function POST(request: Request) {

  const newData = await request.json()

  const metrics = readMetrics()

  const index = metrics.findIndex(
    (m: any) =>
      m.year === newData.year &&
      m.month === newData.month &&
      m.mediatorCode === newData.mediatorCode
  )

  if (index >= 0) {

    metrics[index] = newData

  } else {

    metrics.push(newData)

  }

  fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2))

  return NextResponse.json({ ok: true })

}