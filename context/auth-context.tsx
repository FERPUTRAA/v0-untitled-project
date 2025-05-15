"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useFirebaseAuth } from "./firebase-auth-context"
import { getUserByFirebaseUid } from "@/lib/models/user"

type User = {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  bio?: string
  createdAt: number
  lastOnline?: number
  firebaseUid?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const firebaseAuth = useFirebaseAuth()

  useEffect(() => {
    const fetchUser = async () => {
      if (firebaseAuth.user) {
        try {
          // Coba dapatkan user dari database berdasarkan Firebase UID
          const dbUser = await getUserByFirebaseUid(firebaseAuth.user.uid)
          if (dbUser) {
            setUser(dbUser)
          } else {
            // Jika tidak ditemukan, gunakan data dari Firebase
            setUser({
              id: firebaseAuth.user.uid,
              email: firebaseAuth.user.email || "",
              fullName: firebaseAuth.user.displayName || "",
              avatarUrl: firebaseAuth.user.photoURL || undefined,
              createdAt: Date.now(),
              firebaseUid: firebaseAuth.user.uid,
            })
          }
        } catch (error) {
          console.error("Error fetching user from database:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    fetchUser()
  }, [firebaseAuth.user])

  // Gunakan fungsi dari Firebase Auth
  const signIn = firebaseAuth.signIn
  const signUp = firebaseAuth.signUp
  const signInWithGoogle = firebaseAuth.signInWithGoogle
  const signOut = firebaseAuth.signOut

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || firebaseAuth.loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
