import { NextResponse } from "next/server"
import { checkRedisConnection } from "@/lib/redis"

export async function GET() {
  try {
    // Periksa koneksi Redis
    const redisConnected = await checkRedisConnection()

    if (!redisConnected) {
      return NextResponse.json(
        {
          status: "error",
          message: "Redis connection failed",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "ok",
      services: {
        redis: "connected",
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
