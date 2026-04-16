import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { tokenHasStore } from "@/lib/jwt"

const PUBLIC_PATHS = new Set(["/", "/login", "/cadastro"])
const STORE_SETUP_PATH = "/loja"

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const rawToken = request.cookies.get("token")?.value
  const token = rawToken ? decodeURIComponent(rawToken) : null
  const hasStore = token ? tokenHasStore(token) : false

  if (PUBLIC_PATHS.has(pathname)) {
    if (pathname === "/login" && token) {
      const url = request.nextUrl.clone()
      url.pathname = hasStore ? "/clientes" : STORE_SETUP_PATH
      url.search = ""
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === STORE_SETUP_PATH) {
    if (hasStore) {
      const url = request.nextUrl.clone()
      url.pathname = "/clientes"
      url.search = ""
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  if (!hasStore) {
    const url = request.nextUrl.clone()
    url.pathname = STORE_SETUP_PATH
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
