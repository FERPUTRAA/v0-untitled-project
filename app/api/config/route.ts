import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    googleRedirectUri:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/google/callback`,
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3001",
  })
}
