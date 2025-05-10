import { io } from "socket.io-client"

// Inisialisasi koneksi Socket.io
export const initializeSocket = async (userId: string) => {
  // Coba dapatkan URL WebSocket dari API config
  let websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL

  if (!websocketUrl) {
    try {
      const response = await fetch("/api/config")
      if (response.ok) {
        const config = await response.json()
        websocketUrl = config.websocketUrl
      }
    } catch (error) {
      console.error("Failed to fetch websocket URL:", error)
    }
  }

  // Fallback ke localhost jika tidak ada URL yang ditemukan
  const socketUrl = websocketUrl || "http://localhost:3001"

  const socket = io(socketUrl, {
    auth: {
      userId,
    },
  })

  return socket
}

// Tipe untuk event handler
export type SocketEventHandler = (data: any) => void

// Fungsi untuk mengirim pesan melalui socket
export const sendSocketMessage = (socket: any, event: string, data: any) => {
  if (socket && socket.connected) {
    socket.emit(event, data)
  }
}
