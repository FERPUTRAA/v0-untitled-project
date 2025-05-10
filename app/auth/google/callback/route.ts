import { type NextRequest, NextResponse } from "next/server"
import { loginWithGoogle } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_code", request.url))
  }

  const { user, error } = await loginWithGoogle(code)

  if (error || !user) {
    return NextResponse.redirect(new URL(`/auth/login?error=${error}`, request.url))
  }

  return NextResponse.redirect(new URL("/dashboard", request.url))
}
