import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  // Periksa autentikasi untuk keamanan
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Hanya kirim environment variables yang aman untuk klien
  return NextResponse.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleRedirectUri:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/google/callback`,
    websocketUrl:
      process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      (process.env.VERCEL_URL ? `wss://${process.env.VERCEL_URL}` : "http://localhost:3001"),
  })
}
