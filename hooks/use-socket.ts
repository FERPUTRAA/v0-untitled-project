"use client"

import { useState, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket(userId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (!userId) return

    // Fungsi untuk mendapatkan token JWT
    const getAuthToken = async () => {
      try {
        const response = await fetch("/api/auth/token")
        if (!response.ok) throw new Error("Failed to get auth token")
        const data = await response.json()
        return data.token
      } catch (err) {
        console.error("Error getting auth token:", err)
        setError("Failed to authenticate socket connection")
        return null
      }
    }

    // Fungsi untuk membuat koneksi socket
    const connectSocket = async () => {
      try {
        const token = await getAuthToken()
        if (!token) return

        // Buat URL socket
        const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || window.location.origin

        // Buat instance socket
        const newSocket = io(socketUrl, {
          path: "/api/socket",
          auth: {
            userId,
            token,
          },
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        })

        // Event handlers
        newSocket.on("connect", () => {
          console.log("Socket connected")
          setIsConnected(true)
          reconnectAttempts.current = 0
          setError(null)
        })

        newSocket.on("connect_error", (err) => {
          console.error("Socket connection error:", err)
          setError(`Connection error: ${err.message}`)

          reconnectAttempts.current += 1
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            newSocket.disconnect()
            setError("Failed to connect after multiple attempts")
          }
        })

        newSocket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason)
          setIsConnected(false)

          if (reason === "io server disconnect") {
            // Server memutuskan koneksi, coba sambungkan kembali secara manual
            newSocket.connect()
          }
        })

        setSocket(newSocket)

        // Cleanup function
        return () => {
          newSocket.disconnect()
          setSocket(null)
          setIsConnected(false)
        }
      } catch (err) {
        console.error("Error setting up socket:", err)
        setError("Failed to set up socket connection")
      }
    }

    const cleanup = connectSocket()
    return () => {
      if (cleanup && typeof cleanup === "function") {
        cleanup()
      }
    }
  }, [userId])

  return { socket, isConnected, error }
}
