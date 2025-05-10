import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJwt } from "./lib/auth"

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value

  // Jika tidak ada token dan mencoba mengakses rute yang dilindungi
  if (!token && isProtectedRoute(req.nextUrl.pathname)) {
    const redirectUrl = new URL("/auth/login", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Jika ada token, verifikasi
  if (token) {
    const payload = await verifyJwt(token)

    // Jika token tidak valid dan mencoba mengakses rute yang dilindungi
    if (!payload && isProtectedRoute(req.nextUrl.pathname)) {
      const redirectUrl = new URL("/auth/login", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Jika token valid dan mencoba mengakses halaman auth
    if (payload && isAuthRoute(req.nextUrl.pathname)) {
      const redirectUrl = new URL("/dashboard", req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

// Rute yang memerlukan autentikasi
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ["/dashboard", "/profile", "/chats", "/call", "/users", "/security-setup"]

  return protectedRoutes.some((route) => pathname.startsWith(route))
}

// Rute autentikasi yang tidak boleh diakses jika sudah login
function isAuthRoute(pathname: string): boolean {
  const authRoutes = ["/auth/login", "/auth/signup", "/auth/verify-email"]

  return authRoutes.some((route) => pathname.startsWith(route))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
