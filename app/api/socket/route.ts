import { Server } from "socket.io"
import type { NextRequest } from "next/server"
import { redis } from "@/lib/redis"
import { verifyJwt } from "@/lib/auth"

// Simpan koneksi aktif
const connectedUsers = new Map()

// Simpan instance server Socket.io
let io: any

export async function GET(req: NextRequest) {
  // Verifikasi token dari header Authorization
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 })
  }

  const token = authHeader.split(" ")[1]
  const payload = await verifyJwt(token)

  if (!payload || !payload.userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const userId = payload.userId as string

  // Jika server belum diinisialisasi, buat server baru
  if (!io) {
    // Buat server Socket.io
    io = new Server({
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      path: "/api/socket",
    })

    // Tangani koneksi baru
    io.on("connection", (socket) => {
      // Dapatkan userId dari auth data
      const userId = socket.handshake.auth.userId
      if (!userId) {
        socket.disconnect()
        return
      }

      console.log(`User connected: ${userId}`)

      // Simpan koneksi
      connectedUsers.set(userId, socket.id)

      // Update status online di Redis
      redis.hset(`user:${userId}`, { isOnline: true, lastOnline: new Date().toISOString() })

      // Kirim daftar pengguna online
      io.emit("users:online", Array.from(connectedUsers.keys()))

      // Handle pesan chat
      socket.on("chat:message", async (data) => {
        const { receiverId, message, messageId } = data

        // Simpan pesan di Redis
        await redis.zadd(`messages:${userId}:${receiverId}`, {
          score: Date.now(),
          member: JSON.stringify({
            id: messageId,
            senderId: userId,
            receiverId,
            content: message,
            createdAt: new Date().toISOString(),
            read: false,
          }),
        })

        // Simpan juga di set penerima untuk riwayat dua arah
        await redis.zadd(`messages:${receiverId}:${userId}`, {
          score: Date.now(),
          member: JSON.stringify({
            id: messageId,
            senderId: userId,
            receiverId,
            content: message,
            createdAt: new Date().toISOString(),
            read: false,
          }),
        })

        // Kirim pesan ke penerima jika online
        const receiverSocketId = connectedUsers.get(receiverId)
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("chat:message", {
            id: messageId,
            senderId: userId,
            content: message,
            createdAt: new Date().toISOString(),
          })
        }

        // Kirim konfirmasi pengiriman ke pengirim
        socket.emit("chat:message:sent", { messageId })
      })

      // Handle read receipt
      socket.on("chat:read", async (data) => {
        const { senderId, messageIds } = data

        // Update status pesan di Redis
        for (const messageId of messageIds) {
          // Dapatkan pesan dari Redis
          const messages = await redis.zrange(`messages:${senderId}:${userId}`, 0, -1)

          for (let i = 0; i < messages.length; i++) {
            const message = JSON.parse(messages[i])
            if (message.id === messageId) {
              message.read = true
              await redis.zremrangebyrank(`messages:${senderId}:${userId}`, i, i)
              await redis.zadd(`messages:${senderId}:${userId}`, {
                score: new Date(message.createdAt).getTime(),
                member: JSON.stringify(message),
              })
              break
            }
          }
        }

        // Kirim read receipt ke pengirim jika online
        const senderSocketId = connectedUsers.get(senderId)
        if (senderSocketId) {
          io.to(senderSocketId).emit("chat:read", {
            readerId: userId,
            messageIds,
          })
        }
      })

      // Handle typing indicator
      socket.on("chat:typing", (data) => {
        const { receiverId, isTyping } = data

        const receiverSocketId = connectedUsers.get(receiverId)
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("chat:typing", {
            senderId: userId,
            isTyping,
          })
        }
      })

      // Handle panggilan
      socket.on("call:request", (data) => {
        const { receiverId, offer } = data

        const receiverSocketId = connectedUsers.get(receiverId)
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("call:incoming", {
            callerId: userId,
            offer,
          })
        } else {
          // Penerima offline, kirim respons ke penelepon
          socket.emit("call:rejected", {
            receiverId,
            reason: "offline",
          })
        }
      })

      socket.on("call:answer", (data) => {
        const { callerId, answer } = data

        const callerSocketId = connectedUsers.get(callerId)
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:answered", {
            receiverId: userId,
            answer,
          })
        }
      })

      socket.on("call:reject", (data) => {
        const { callerId, reason } = data

        const callerSocketId = connectedUsers.get(callerId)
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:rejected", {
            receiverId: userId,
            reason: reason || "rejected",
          })
        }
      })

      socket.on("call:ice-candidate", (data) => {
        const { targetId, candidate } = data

        const targetSocketId = connectedUsers.get(targetId)
        if (targetSocketId) {
          io.to(targetSocketId).emit("call:ice-candidate", {
            senderId: userId,
            candidate,
          })
        }
      })

      socket.on("call:end", (data) => {
        const { targetId } = data

        const targetSocketId = connectedUsers.get(targetId)
        if (targetSocketId) {
          io.to(targetSocketId).emit("call:ended", {
            senderId: userId,
          })
        }
      })

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${userId}`)

        // Hapus koneksi
        connectedUsers.delete(userId)

        // Update status offline di Redis
        redis.hset(`user:${userId}`, { isOnline: false, lastOnline: new Date().toISOString() })

        // Kirim daftar pengguna online yang diperbarui
        io.emit("users:online", Array.from(connectedUsers.keys()))
      })
    })

    // Mulai server
    await io.listen(3001)
  }

  return new Response("WebSocket server is running", { status: 200 })
}
