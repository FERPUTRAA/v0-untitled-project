"use client"

import { createContext, useContext, type ReactNode, useEffect, useState } from "react"
import { useSocket } from "@/hooks/use-socket"

type SocketContextType = {
  socket: any
  isConnected: boolean
  error: string | null
  sendMessage: (event: string, data: any) => boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
  sendMessage: () => false,
})

export function useSocketContext() {
  return useContext(SocketContext)
}

type SocketProviderProps = {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [token, setToken] = useState<string | null>(null)

  // Ambil token dari cookie saat komponen dimount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch("/api/auth/token")
        if (response.ok) {
          const data = await response.json()
          setToken(data.token)
        }
      } catch (error) {
        console.error("Failed to fetch auth token:", error)
      }
    }

    fetchToken()
  }, [])

  // Gunakan hook useSocket dengan token
  const { socket, isConnected, error, sendMessage } = useSocket(token)

  return <SocketContext.Provider value={{ socket, isConnected, error, sendMessage }}>{children}</SocketContext.Provider>
}
