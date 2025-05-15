import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "./lib/firebase-admin"

// Daftar rute yang memerlukan autentikasi
const protectedRoutes = ["/dashboard", "/chats", "/profile", "/call"]

// Daftar rute autentikasi
const authRoutes = ["/auth/login", "/auth/signup", "/auth/verify-email"]

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("firebase-auth-token")?.value
  const { pathname } = request.nextUrl

  // Fungsi untuk memeriksa apakah rute adalah rute autentikasi
  const isAuthRoute = (route: string) => {
    return authRoutes.some((authRoute) => pathname.startsWith(authRoute))
  }

  // Fungsi untuk memeriksa apakah rute adalah rute yang dilindungi
  const isProtectedRoute = () => {
    return protectedRoutes.some((route) => pathname.startsWith(route))
  }

  // Jika tidak ada token dan mengakses rute yang dilindungi, redirect ke login
  if (!token && isProtectedRoute()) {
    const url = new URL("/auth/login", request.url)
    return NextResponse.redirect(url)
  }

  // Jika ada token, verifikasi
  if (token) {
    try {
      // Verifikasi token
      await auth.verifyIdToken(token)

      // Jika token valid dan mengakses rute autentikasi, redirect ke dashboard
      if (isAuthRoute()) {
        const url = new URL("/dashboard", request.url)
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // Token tidak valid, hapus cookie
      if (isProtectedRoute()) {
        const response = NextResponse.redirect(new URL("/auth/login", request.url))
        response.cookies.delete("firebase-auth-token")
        return response
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}
