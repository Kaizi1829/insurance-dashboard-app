import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("auth")?.value
  const { pathname } = req.nextUrl

  const isPublicPath =
    pathname === "/login" ||
    pathname === "/api/login" ||
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico"

  if (isPublicPath) {
    return NextResponse.next()
  }

  if (auth === "true") {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL("/login", req.url))
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}