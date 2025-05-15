import { NextResponse } from "next/server"

export async function GET() {
  // Tentukan base URL yang konsisten
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Gunakan redirect URI yang TEPAT SAMA dengan yang terdaftar di Google Cloud Console
  // PENTING: Nilai ini HARUS sama persis dengan yang terdaftar di Google Cloud Console
  const googleRedirectUri = "https://v0-random-friend-app.vercel.app/auth/google/callback"

  console.log("Config API - Google Redirect URI:", googleRedirectUri)

  return NextResponse.json({
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    googleRedirectUri: googleRedirectUri,
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || baseUrl,
  })
}
