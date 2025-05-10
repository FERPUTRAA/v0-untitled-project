"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, logoutUser } from "@/actions/auth-actions"
import { updateUserProfile } from "@/actions/user-actions"

type User = {
  id: string
  email: string
  fullName: string
  username: string
  avatarEmoji: string
  createdAt: string
  updatedAt: string
  lastOnline: string
  location?: string
  bio?: string
  age?: number
  gender?: string
  shareLocation: boolean
  lastProfileChange?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
  updateProfile: (data: any) => Promise<{ error?: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Periksa sesi saat ini
    const checkSession = async () => {
      try {
        const userData = await getUser()
        if (userData) {
          setUser(userData as User)
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const signOut = async () => {
    try {
      await logoutUser()
      setUser(null)
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const updateProfile = async (data: any) => {
    if (!user) {
      return { error: new Error("User not authenticated") }
    }

    try {
      const result = await updateUserProfile(data)

      if (result.error) {
        return { error: result.error }
      }

      // Perbarui state user
      setUser((prev) => (prev ? { ...prev, ...data } : null))

      return {}
    } catch (error) {
      console.error("Error updating profile:", error)
      return { error }
    }
  }

  const value = {
    user,
    isLoading,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
