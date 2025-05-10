"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Smile } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSocketContext } from "@/context/socket-context"
import { getChatMessagesWithUser } from "@/actions/message-actions"
import { v4 as uuidv4 } from "uuid"

interface RealTimeChatProps {
  userId: string
  contactId: string
  contactName: string
}

export function RealTimeChat({ userId, contactId, contactName }: RealTimeChatProps) {
  const { socket, isConnected } = useSocketContext()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [contactTyping, setContactTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Ambil riwayat pesan
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await getChatMessagesWithUser(contactId)
      if (data && !error) {
        setMessages(data)

        // Tandai pesan sebagai dibaca
        const unreadMessages = data.filter((msg) => msg.senderId === contactId && !msg.read).map((msg) => msg.id)

        if (unreadMessages.length > 0 && socket) {
          socket.emit("chat:read", {
            senderId: contactId,
            messageIds: unreadMessages,
          })
        }
      }
    }

    if (contactId) {
      fetchMessages()
    }
  }, [contactId, socket])

  // Set up event listener untuk pesan masuk
  useEffect(() => {
    if (!socket) return

    const handleIncomingMessage = (data: any) => {
      if (data.senderId === contactId) {
        const newMessage = {
          id: data.id,
          senderId: data.senderId,
          receiverId: userId,
          content: data.content,
          createdAt: data.createdAt,
          read: true,
        }

        setMessages((prev) => [...prev, newMessage])

        // Kirim read receipt
        socket.emit("chat:read", {
          senderId: contactId,
          messageIds: [data.id],
        })
      }
    }

    const handleMessageSent = (data: any) => {
      // Update status pesan di state
      setMessages((prev) => prev.map((msg) => (msg.id === data.messageId ? { ...msg, sent: true } : msg)))
    }

    const handleReadReceipt = (data: any) => {
      if (data.readerId === contactId) {
        // Update status pesan di state
        setMessages((prev) => prev.map((msg) => (data.messageIds.includes(msg.id) ? { ...msg, read: true } : msg)))
      }
    }

    const handleTyping = (data: any) => {
      if (data.senderId === contactId) {
        setContactTyping(data.isTyping)
      }
    }

    socket.on("chat:message", handleIncomingMessage)
    socket.on("chat:message:sent", handleMessageSent)
    socket.on("chat:read", handleReadReceipt)
    socket.on("chat:typing", handleTyping)

    return () => {
      socket.off("chat:message", handleIncomingMessage)
      socket.off("chat:message:sent", handleMessageSent)
      socket.off("chat:read", handleReadReceipt)
      socket.off("chat:typing", handleTyping)
    }
  }, [socket, userId, contactId])

  // Auto-scroll ke bawah saat pesan berubah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Kirim indikator mengetik
  useEffect(() => {
    if (!socket || !isConnected) return

    if (isTyping) {
      socket.emit("chat:typing", {
        receiverId: contactId,
        isTyping: true,
      })
    }

    // Bersihkan timeout sebelumnya
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout baru untuk berhenti mengetik
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && isConnected) {
        socket.emit("chat:typing", {
          receiverId: contactId,
          isTyping: false,
        })
      }
      setIsTyping(false)
    }, 2000)

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [isTyping, socket, isConnected, contactId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || !socket) return

    const messageId = uuidv4()
    const newMessage = {
      id: messageId,
      senderId: userId,
      receiverId: contactId,
      content: input,
      createdAt: new Date().toISOString(),
      read: false,
      sent: false,
    }

    // Tambahkan pesan ke state
    setMessages((prev) => [...prev, newMessage])

    // Kirim pesan melalui socket
    socket.emit("chat:message", {
      receiverId: contactId,
      message: input,
      messageId,
    })

    // Reset input dan status mengetik
    setInput("")
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Kirim status berhenti mengetik
    socket.emit("chat:typing", {
      receiverId: contactId,
      isTyping: false,
    })
  }

  const addEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji)
    setIsTyping(true)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.senderId === userId ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                message.senderId === userId ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              {message.content}
              {message.senderId === userId && (
                <span className="text-xs ml-2 opacity-70">{message.read ? "✓✓" : message.sent ? "✓" : "⏱"}</span>
              )}
            </div>
          </div>
        ))}
        {contactTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg">{contactName} sedang mengetik...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="grid grid-cols-8 gap-1">
                {[
                  "😀",
                  "😂",
                  "😍",
                  "🥰",
                  "😎",
                  "🤔",
                  "😊",
                  "👍",
                  "❤️",
                  "😢",
                  "😭",
                  "🎉",
                  "🔥",
                  "👏",
                  "🙏",
                  "✨",
                  "🥺",
                  "😘",
                  "🤣",
                  "😅",
                  "😁",
                  "😆",
                  "😉",
                  "🤗",
                  "🤩",
                  "😋",
                  "😇",
                  "🥳",
                  "😜",
                  "😝",
                  "🤪",
                  "😏",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    className="text-xl p-1 hover:bg-gray-100 rounded"
                    onClick={() => addEmoji(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={isConnected ? "Ketik pesan..." : "Menghubungkan..."}
            className="flex-1"
            disabled={!isConnected}
          />

          <Button type="submit" size="icon" disabled={!isConnected || !input.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
