import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { password } = await req.json()

  if (password !== process.env.ACCESS_KEY) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const cookieStore = await cookies()

  cookieStore.set("auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })

  return NextResponse.json({ ok: true })
}