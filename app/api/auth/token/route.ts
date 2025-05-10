import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyJwt, generateJwt } from "@/lib/auth"

export async function GET() {
  try {
    // Dapatkan token dari cookie
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth_token")?.value

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verifikasi token
    const payload = await verifyJwt(authToken)
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Buat token khusus untuk socket dengan waktu kedaluwarsa yang lebih pendek
    const socketToken = await generateJwt(
      { userId: payload.userId },
      { expiresIn: "1h" }, // Token socket berlaku 1 jam
    )

    return NextResponse.json({ token: socketToken })
  } catch (error) {
    console.error("Error generating socket token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
