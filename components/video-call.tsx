"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { WebRTCConnection } from "@/lib/webrtc"
import { sendSocketMessage } from "@/lib/socket"

interface VideoCallProps {
  socket: any
  userId: string
  contactId: string
  isIncoming: boolean
  offer?: RTCSessionDescriptionInit
  onEndCall: () => void
}

export function VideoCall({ socket, userId, contactId, isIncoming, offer, onEndCall }: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const webrtcRef = useRef<WebRTCConnection | null>(null)

  useEffect(() => {
    // Inisialisasi WebRTC
    const initializeWebRTC = async () => {
      try {
        // Buat koneksi WebRTC
        webrtcRef.current = new WebRTCConnection(
          // Handler untuk ICE candidate
          (candidate) => {
            sendSocketMessage(socket, "call:ice-candidate", {
              targetId: contactId,
              candidate,
            })
          },
          // Handler untuk track
          (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream
            }
          },
        )

        // Tambahkan stream lokal
        const localStream = await webrtcRef.current.addLocalStream()
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }

        // Jika ini adalah panggilan masuk, terima offer
        if (isIncoming && offer) {
          await webrtcRef.current.receiveOffer(offer)
          const answer = await webrtcRef.current.createAnswer()
          sendSocketMessage(socket, "call:answer", {
            callerId: contactId,
            answer,
          })
        }
        // Jika ini adalah panggilan keluar, buat offer
        else {
          const offer = await webrtcRef.current.createOffer()
          sendSocketMessage(socket, "call:request", {
            receiverId: contactId,
            offer,
          })
        }

        setIsConnecting(false)
      } catch (error) {
        console.error("Error initializing WebRTC:", error)
        setIsConnecting(false)
        onEndCall()
      }
    }

    initializeWebRTC()

    // Set up event listeners
    const handleCallAnswered = async (data: any) => {
      if (data.receiverId === contactId && webrtcRef.current) {
        await webrtcRef.current.receiveAnswer(data.answer)
        setIsConnected(true)
      }
    }

    const handleIceCandidate = async (data: any) => {
      if (data.senderId === contactId && webrtcRef.current) {
        await webrtcRef.current.addIceCandidate(data.candidate)
      }
    }

    const handleCallEnded = (data: any) => {
      if (data.senderId === contactId) {
        endCall()
      }
    }

    socket.on("call:answered", handleCallAnswered)
    socket.on("call:ice-candidate", handleIceCandidate)
    socket.on("call:ended", handleCallEnded)

    return () => {
      // Clean up
      socket.off("call:answered", handleCallAnswered)
      socket.off("call:ice-candidate", handleIceCandidate)
      socket.off("call:ended", handleCallEnded)

      if (webrtcRef.current) {
        webrtcRef.current.close()
      }
    }
  }, [socket, userId, contactId, isIncoming, offer, onEndCall])

  const toggleMute = () => {
    if (webrtcRef.current && webrtcRef.current.localStream) {
      const audioTracks = webrtcRef.current.localStream.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (webrtcRef.current && webrtcRef.current.localStream) {
      const videoTracks = webrtcRef.current.localStream.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  const endCall = () => {
    sendSocketMessage(socket, "call:end", {
      targetId: contactId,
    })

    if (webrtcRef.current) {
      webrtcRef.current.close()
    }

    onEndCall()
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6 flex flex-col items-center">
        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

          <div className="absolute bottom-4 right-4 w-1/4 aspect-video bg-gray-200 rounded overflow-hidden border-2 border-white">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        </div>

        {isConnecting && (
          <div className="text-center mb-4">
            <p className="text-lg font-medium">Connecting...</p>
            <p className="text-sm text-gray-500">Please wait while we establish the connection</p>
          </div>
        )}

        <div className="flex space-x-4">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={toggleMute}>
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={endCall}>
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={toggleVideo}>
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
