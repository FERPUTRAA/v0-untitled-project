"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUser } from "@/actions/auth-actions"
import { Loader2 } from "lucide-react"

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getUser()

        // Jika tidak ada user dan bukan di halaman auth
        if (!user && !isAuthRoute(pathname)) {
          router.push("/auth/login")
          return
        }

        // Jika ada user dan di halaman auth
        if (user && isAuthRoute(pathname)) {
          router.push("/dashboard")
          return
        }
      } catch (error) {
        console.error("Auth check error:", error)
        if (!isAuthRoute(pathname)) {
          router.push("/auth/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}

// Rute autentikasi yang tidak memerlukan pengecekan
function isAuthRoute(pathname: string): boolean {
  const authRoutes = ["/auth/login", "/auth/signup", "/auth/verify-email"]
  return authRoutes.includes(pathname)
}
