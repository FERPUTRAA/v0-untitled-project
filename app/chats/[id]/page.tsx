"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, PhoneOff, User } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAuth } from "@/context/auth-context"
import { RealTimeChat } from "@/components/real-time-chat"
import { AudioCall } from "@/components/audio-call"
import { useSocketContext } from "@/context/socket-context"
import { getUserById } from "@/actions/user-actions"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { socket, isConnected } = useSocketContext()
  const chatId = params.id as string
  const [contact, setContact] = useState<any>(null)
  const [isInCall, setIsInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Ambil informasi kontak
  useEffect(() => {
    const fetchContact = async () => {
      if (!chatId) return

      try {
        const contact = await getUserById(chatId)
        if (contact) {
          setContact(contact)
        }
      } catch (error) {
        console.error("Error fetching contact:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContact()
  }, [chatId])

  // Set up event listener untuk panggilan masuk
  useEffect(() => {
    if (!socket || !user) return

    const handleIncomingCall = (data: any) => {
      if (data.callerId === chatId) {
        setIncomingCall(data)
      }
    }

    const handleCallEnded = (data: any) => {
      if (data.senderId === chatId) {
        setIsInCall(false)
        setIncomingCall(null)
      }
    }

    socket.on("call:incoming", handleIncomingCall)
    socket.on("call:ended", handleCallEnded)

    return () => {
      socket.off("call:incoming", handleIncomingCall)
      socket.off("call:ended", handleCallEnded)
    }
  }, [socket, user, chatId])

  const startCall = () => {
    if (!socket || !isConnected) return
    setIsInCall(true)
  }

  const endCall = () => {
    setIsInCall(false)
    setIncomingCall(null)
  }

  const acceptIncomingCall = () => {
    setIsInCall(true)
    setIncomingCall(null)
  }

  const rejectIncomingCall = () => {
    if (socket && isConnected) {
      socket.emit("call:reject", {
        callerId: chatId,
        reason: "rejected",
      })
    }
    setIncomingCall(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  if (!user || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg mb-4">Kontak tidak ditemukan</p>
        <Button onClick={() => router.push("/chats")}>Kembali ke Daftar Chat</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              {contact.avatarEmoji || <User className="h-5 w-5 text-gray-500" />}
            </div>
            <div>
              <h1 className="font-medium">{contact.fullName}</h1>
              <p className="text-xs text-gray-500">{contact.isOnline ? "Online" : "Offline"}</p>
            </div>
          </div>
          <div className="ml-auto">
            <Button
              variant={isInCall ? "default" : "ghost"}
              size="icon"
              onClick={isInCall ? endCall : startCall}
              className={isInCall ? "bg-red-600 hover:bg-red-700" : ""}
              disabled={!isConnected}
            >
              {isInCall ? <PhoneOff className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {isInCall ? (
          <div className="p-4">
            <AudioCall
              userId={user.id}
              contactId={chatId}
              contactName={contact.fullName}
              contactAvatar={contact.avatarEmoji}
              isIncoming={!!incomingCall}
              offer={incomingCall?.offer}
              onEndCall={endCall}
            />
          </div>
        ) : (
          <RealTimeChat userId={user.id} contactId={chatId} contactName={contact.fullName} />
        )}
      </main>

      {/* Dialog untuk panggilan masuk */}
      <Dialog open={!!incomingCall && !isInCall} onOpenChange={rejectIncomingCall}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
              {contact.avatarEmoji || <User className="h-8 w-8 text-gray-500" />}
            </div>
            <h2 className="text-xl font-bold">{contact.fullName}</h2>
            <p className="text-gray-500">Panggilan masuk...</p>

            <div className="flex space-x-4 mt-4">
              <Button variant="destructive" onClick={rejectIncomingCall}>
                Tolak
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={acceptIncomingCall}>
                Terima
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
