"use client"

import { useEffect, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    // Ambil URL WebSocket dari environment variable atau fallback ke localhost
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3001"

    // Buat koneksi socket
    const socketInstance = io(websocketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Event handlers
    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
      setError(null)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err)
      setError("Failed to connect to server")
      setIsConnected(false)
    })

    // Simpan instance socket
    setSocket(socketInstance)

    // Cleanup
    return () => {
      socketInstance.disconnect()
    }
  }, [token])

  // Fungsi untuk mengirim pesan
  const sendMessage = useCallback(
    (event: string, data: any) => {
      if (socket && isConnected) {
        socket.emit(event, data)
        return true
      }
      return false
    },
    [socket, isConnected],
  )

  return { socket, isConnected, error, sendMessage }
}
