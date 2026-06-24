import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { tokenHasStore } from "@/lib/jwt"

// Rotas públicas (não exigem token)
const PUBLIC_PATHS = new Set(["/", "/login", "/cadastro"])

// Rota de setup da loja (usuário sem loja criada cai aqui)
const STORE_SETUP_PATH = "/loja"

// decode seguro do cookie (evita exceção por encoding inválido)
const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl

  // Helper para redirecionar limpando query
  const redirectTo = (targetPathname: string) => {
    const url = request.nextUrl.clone()
    url.pathname = targetPathname
    url.search = ""
    return NextResponse.redirect(url)
  }

  // Ignora rotas internas, APIs e arquivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Token vem do cookie (middleware roda no servidor/edge)
  const rawToken = request.cookies.get("token")?.value
  const token = rawToken ? safeDecodeURIComponent(rawToken) : null

  // Flag simples: token indica se já existe loja
  const hasStore = token ? tokenHasStore(token) : false

  // Rotas públicas passam; /login com token redireciona
  if (PUBLIC_PATHS.has(pathname)) {
    if (pathname === "/login" && token) {
      return redirectTo(hasStore ? "/dashboard" : STORE_SETUP_PATH)
    }

    return NextResponse.next()
  }

  // Rotas protegidas: sem token -> /login
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // /loja: se já tem loja -> /dashboard; senão, continua
  if (pathname === STORE_SETUP_PATH) {
    if (hasStore) {
      return redirectTo("/dashboard")
    }

    return NextResponse.next()
  }

  // Qualquer outra rota protegida: sem loja -> /loja
  if (!hasStore) {
    return redirectTo(STORE_SETUP_PATH)
  }

  return NextResponse.next()
}

export const config = {
  // Aplica em quase todas as rotas (assets também são filtrados no `if` acima)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
