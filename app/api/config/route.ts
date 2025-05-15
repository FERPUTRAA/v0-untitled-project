import { NextResponse } from "next/server"

export async function GET() {
  // Tentukan base URL berdasarkan environment
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Gunakan NEXT_PUBLIC_GOOGLE_REDIRECT_URI jika tersedia, atau buat dari base URL
  const googleRedirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${baseUrl}/auth/google/callback`

  // Log untuk debugging
  console.log("Config API - Base URL:", baseUrl)
  console.log("Config API - Google Redirect URI:", googleRedirectUri)

  return NextResponse.json({
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    googleRedirectUri: googleRedirectUri,
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || baseUrl,
  })
}
