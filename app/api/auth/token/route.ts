import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyJwt, generateJwt } from "@/lib/auth"

export async function GET() {
  try {
    const authToken = cookies().get("auth-token")?.value

    if (!authToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify the auth token
    const payload = await verifyJwt(authToken)

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Generate a short-lived token for socket authentication
    const socketToken = await generateJwt({
      userId: payload.userId,
      purpose: "socket",
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    })

    return NextResponse.json({ token: socketToken })
  } catch (error) {
    console.error("Error generating socket token:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
