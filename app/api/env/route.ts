export async function GET() {
  return Response.json({
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: `${process.env.VERCEL_URL || "http://localhost:3000"}/auth/google/callback`,
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.WEBSOCKET_URL || "http://localhost:3001",
  })
}
