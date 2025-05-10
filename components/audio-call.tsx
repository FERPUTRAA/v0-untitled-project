"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PhoneOff, Mic, MicOff, User } from "lucide-react"
import { AudioCallConnection } from "@/lib/audio-call"
import { useSocketContext } from "@/context/socket-context"

interface AudioCallProps {
  userId: string
  contactId: string
  contactName: string
  contactAvatar?: string
  isIncoming: boolean
  offer?: RTCSessionDescriptionInit
  onEndCall: () => void
}

export function AudioCall({
  userId,
  contactId,
  contactName,
  contactAvatar,
  isIncoming,
  offer,
  onEndCall,
}: AudioCallProps) {
  const { socket, isConnected } = useSocketContext()
  const [isMuted, setIsMuted] = useState(false)
  const [isWebRtcConnected, setIsWebRtcConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [connectionState, setConnectionState] = useState<string>("new")
  const audioRef = useRef<HTMLAudioElement>(null)
  const webrtcRef = useRef<AudioCallConnection | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Inisialisasi WebRTC
    const initializeWebRTC = async () => {
      if (!socket || !isConnected) {
        console.error("Socket not connected")
        return
      }

      try {
        // Buat koneksi WebRTC
        webrtcRef.current = new AudioCallConnection(
          // Handler untuk ICE candidate
          (candidate) => {
            socket.emit("call:ice-candidate", {
              targetId: contactId,
              candidate,
            })
          },
          // Handler untuk track
          (stream) => {
            if (audioRef.current) {
              audioRef.current.srcObject = stream
              audioRef.current.play().catch((e) => console.error("Error playing audio:", e))
            }
          },
          // Handler untuk connection state change
          (state) => {
            setConnectionState(state)
            if (state === "connected") {
              setIsWebRtcConnected(true)
              setIsConnecting(false)
              // Mulai timer durasi panggilan
              timerRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1)
              }, 1000)
            } else if (state === "disconnected" || state === "failed" || state === "closed") {
              setIsWebRtcConnected(false)
              if (timerRef.current) {
                clearInterval(timerRef.current)
              }
            }
          },
        )

        // Tambahkan stream audio lokal
        await webrtcRef.current.addLocalAudioStream()

        // Jika ini adalah panggilan masuk, terima offer
        if (isIncoming && offer) {
          await webrtcRef.current.receiveOffer(offer)
          const answer = await webrtcRef.current.createAnswer()
          socket.emit("call:answer", {
            callerId: contactId,
            answer,
          })
        }
        // Jika ini adalah panggilan keluar, buat offer
        else {
          const offer = await webrtcRef.current.createOffer()
          socket.emit("call:request", {
            receiverId: contactId,
            offer,
          })
        }
      } catch (error) {
        console.error("Error initializing WebRTC:", error)
        setIsConnecting(false)
        onEndCall()
      }
    }

    initializeWebRTC()

    // Set up event listeners
    const handleCallAnswered = async (data: any) => {
      if (data.callerId === userId && webrtcRef.current) {
        try {
          await webrtcRef.current.receiveAnswer(data.answer)
        } catch (error) {
          console.error("Error receiving answer:", error)
        }
      }
    }

    const handleIceCandidate = async (data: any) => {
      if (data.senderId === contactId && webrtcRef.current) {
        try {
          await webrtcRef.current.addIceCandidate(data.candidate)
        } catch (error) {
          console.error("Error adding ICE candidate:", error)
        }
      }
    }

    const handleCallEnded = (data: any) => {
      if (data.senderId === contactId) {
        endCall()
      }
    }

    if (socket) {
      socket.on("call:answered", handleCallAnswered)
      socket.on("call:ice-candidate", handleIceCandidate)
      socket.on("call:ended", handleCallEnded)
    }

    return () => {
      // Clean up
      if (socket) {
        socket.off("call:answered", handleCallAnswered)
        socket.off("call:ice-candidate", handleIceCandidate)
        socket.off("call:ended", handleCallEnded)
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (webrtcRef.current) {
        webrtcRef.current.close()
      }
    }
  }, [socket, isConnected, userId, contactId, isIncoming, offer, onEndCall])

  const toggleMute = () => {
    if (webrtcRef.current) {
      webrtcRef.current.setMuted(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  const endCall = () => {
    if (socket && isConnected) {
      socket.emit("call:end", {
        targetId: contactId,
      })
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (webrtcRef.current) {
      webrtcRef.current.close()
    }

    onEndCall()
  }

  // Format durasi panggilan
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return [
      hours > 0 ? hours.toString().padStart(2, "0") : null,
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":")
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 flex flex-col items-center">
        {/* Audio element (hidden) */}
        <audio ref={audioRef} autoPlay />

        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          {contactAvatar ? (
            <div className="text-4xl">{contactAvatar}</div>
          ) : (
            <User className="h-12 w-12 text-gray-500" />
          )}
        </div>

        <h2 className="text-xl font-bold mb-2">{contactName}</h2>

        {isConnecting ? (
          <p className="text-gray-500 mb-4">Menghubungkan...</p>
        ) : isWebRtcConnected ? (
          <p className="text-gray-500 mb-4">{formatDuration(callDuration)}</p>
        ) : (
          <p className="text-red-500 mb-4">Koneksi terputus</p>
        )}

        {connectionState !== "connected" && connectionState !== "new" && (
          <p className="text-sm text-gray-500 mb-4">Status: {connectionState}</p>
        )}

        <div className="flex space-x-4 mt-4">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={toggleMute}
            disabled={!isWebRtcConnected}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={endCall}>
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
