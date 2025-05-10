import { Server } from "socket.io"
import { verifyJwt } from "@/lib/auth"
import { Redis } from "@upstash/redis"
import { createMessage } from "@/lib/models/message"
import { updateLastOnline } from "@/lib/auth"

// Inisialisasi Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

export async function GET(req: Request) {
  // Ini adalah endpoint untuk WebSocket, bukan HTTP
  return new Response("WebSocket server", { status: 200 })
}

// Simpan instance socket.io
let io: any

// Fungsi untuk mendapatkan atau membuat instance socket.io
function getIO() {
  if (!io) {
    // @ts-ignore - socket.io types tidak kompatibel dengan Next.js
    io = new Server({
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    })

    // Middleware untuk autentikasi
    io.use(async (socket: any, next: any) => {
      try {
        const token = socket.handshake.auth.token

        if (!token) {
          return next(new Error("Authentication error"))
        }

        const payload = await verifyJwt(token)

        if (!payload || !payload.userId) {
          return next(new Error("Authentication error"))
        }

        // Simpan userId di socket
        socket.userId = payload.userId

        next()
      } catch (error) {
        next(new Error("Authentication error"))
      }
    })

    // Event handlers
    io.on("connection", async (socket: any) => {
      const userId = socket.userId

      console.log(`User connected: ${userId}`)

      // Update status online
      await updateLastOnline(userId)

      // Join room untuk user
      socket.join(`user:${userId}`)

      // Broadcast status online
      socket.broadcast.emit("user:online", { userId })

      // Event untuk pesan chat
      socket.on("chat:message", async (data: any) => {
        try {
          const { conversationId, receiverId, content, type = "text" } = data

          // Simpan pesan ke database
          const message = await createMessage({
            senderId: userId,
            receiverId,
            conversationId,
            content,
            type,
          })

          // Kirim pesan ke pengirim dan penerima
          io.to(`user:${userId}`).to(`user:${receiverId}`).emit("chat:message", message)

          // Kirim konfirmasi ke pengirim
          socket.emit("chat:message:sent", { messageId: message.id })
        } catch (error) {
          console.error("Chat message error:", error)
          socket.emit("error", { message: "Failed to send message" })
        }
      })

      // Event untuk tanda dibaca
      socket.on("chat:read", async (data: any) => {
        try {
          const { conversationId, messageId } = data

          // Broadcast tanda dibaca ke semua user di conversation
          io.to(`conversation:${conversationId}`).emit("chat:read", {
            userId,
            messageId,
            conversationId,
          })
        } catch (error) {
          console.error("Chat read error:", error)
        }
      })

      // Event untuk indikator mengetik
      socket.on("chat:typing", (data: any) => {
        const { conversationId, isTyping } = data

        // Broadcast status mengetik ke conversation
        socket.to(`conversation:${conversationId}`).emit("chat:typing", {
          userId,
          conversationId,
          isTyping,
        })
      })

      // Event untuk panggilan
      socket.on("call:request", (data: any) => {
        const { receiverId, callId } = data

        // Kirim permintaan panggilan ke penerima
        io.to(`user:${receiverId}`).emit("call:request", {
          callerId: userId,
          callId,
        })
      })

      socket.on("call:answer", (data: any) => {
        const { callerId, callId, accepted } = data

        // Kirim jawaban ke pemanggil
        io.to(`user:${callerId}`).emit("call:answer", {
          receiverId: userId,
          callId,
          accepted,
        })

        // Jika diterima, buat room untuk panggilan
        if (accepted) {
          socket.join(`call:${callId}`)
          io.sockets.sockets.get(callerId)?.join(`call:${callId}`)
        }
      })

      socket.on("call:ice-candidate", (data: any) => {
        const { callId, candidate } = data

        // Broadcast ICE candidate ke semua peserta panggilan kecuali pengirim
        socket.to(`call:${callId}`).emit("call:ice-candidate", {
          userId,
          candidate,
        })
      })

      socket.on("call:offer", (data: any) => {
        const { callId, offer } = data

        // Broadcast offer ke semua peserta panggilan kecuali pengirim
        socket.to(`call:${callId}`).emit("call:offer", {
          userId,
          offer,
        })
      })

      socket.on("call:answer-sdp", (data: any) => {
        const { callId, answer } = data

        // Broadcast answer ke semua peserta panggilan kecuali pengirim
        socket.to(`call:${callId}`).emit("call:answer-sdp", {
          userId,
          answer,
        })
      })

      socket.on("call:end", (data: any) => {
        const { callId } = data

        // Broadcast end call ke semua peserta panggilan
        io.to(`call:${callId}`).emit("call:end", {
          userId,
        })

        // Keluarkan semua peserta dari room panggilan
        io.in(`call:${callId}`).socketsLeave(`call:${callId}`)
      })

      // Event disconnect
      socket.on("disconnect", async () => {
        console.log(`User disconnected: ${userId}`)

        // Update status offline
        await redis.del(`online:${userId}`)

        // Broadcast status offline
        socket.broadcast.emit("user:offline", { userId })
      })
    })

    // Start server
    io.listen(3001)
  }

  return io
}

// Panggil getIO untuk memastikan server dimulai
getIO()
