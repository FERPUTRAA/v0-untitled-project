import { type NextRequest, NextResponse } from "next/server"
import { loginWithGoogle } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    // Log untuk debugging
    console.log("Google Callback - Code:", code ? "Present" : "Missing")
    console.log("Google Callback - Error:", error || "None")

    if (error) {
      console.error("Google auth error:", error)
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url))
    }

    if (!code) {
      console.error("Missing authorization code")
      return NextResponse.redirect(new URL("/auth/login?error=missing_code", request.url))
    }

    console.log("Received Google auth code, attempting to exchange for tokens")
    const result = await loginWithGoogle(code)

    if (result.error || !result.user) {
      console.error("Google login error:", result.error)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(result.error || "Unknown error")}`, request.url),
      )
    }

    console.log("Google login successful, redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (error: any) {
    console.error("Unexpected error in Google callback:", error)
    const errorMessage = error.message || "server_error"
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
