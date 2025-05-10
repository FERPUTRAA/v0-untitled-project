"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useSocket } from "@/hooks/use-socket"
import { useAuth } from "@/context/auth-context"

type SocketContextType = {
  socket: any
  isConnected: boolean
  error: string | null
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { socket, isConnected, error } = useSocket(user?.id || null)

  return <SocketContext.Provider value={{ socket, isConnected, error }}>{children}</SocketContext.Provider>
}

export function useSocketContext() {
  return useContext(SocketContext)
}
