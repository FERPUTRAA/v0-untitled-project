import { type NextRequest, NextResponse } from "next/server"
import { loginWithGoogle } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")

    if (!code) {
      console.error("Missing authorization code")
      return NextResponse.redirect(new URL("/auth/login?error=missing_code", request.url))
    }

    console.log("Received Google auth code, attempting to exchange for tokens")
    const { user, error } = await loginWithGoogle(code)

    if (error || !user) {
      console.error("Google login error:", error)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error || "Unknown error")}`, request.url),
      )
    }

    console.log("Google login successful, redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (error) {
    console.error("Unexpected error in Google callback:", error)
    return NextResponse.redirect(new URL("/auth/login?error=server_error", request.url))
  }
}
