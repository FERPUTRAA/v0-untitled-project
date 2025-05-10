"use client"

import { useState, useEffect, useRef } from "react"
import { useSocketContext } from "@/context/socket-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, PhoneOff } from "lucide-react"
import { formatDuration } from "@/lib/utils"

type User = {
  id: string
  fullName: string
  avatarUrl?: string
}

type AudioCallProps = {
  callId: string
  currentUser: User
  otherUser: User
  onEndCall: () => void
  isIncoming?: boolean
  autoAnswer?: boolean
}

export function AudioCall({
  callId,
  currentUser,
  otherUser,
  onEndCall,
  isIncoming = false,
  autoAnswer = false,
}: AudioCallProps) {
  const [isConnecting, setIsConnecting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const { socket, sendMessage } = useSocketContext()

  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Setup WebRTC
  useEffect(() => {
    const setupCall = async () => {
      try {
        // Create peer connection
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
        })

        peerConnectionRef.current = peerConnection

        // Get local stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        localStreamRef.current = stream

        // Add tracks to peer connection
        stream.getAudioTracks().forEach((track) => {
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(track, stream)
          }
        })

        // Set local audio
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            sendMessage("call:ice-candidate", {
              callId,
              candidate: event.candidate,
            })
          }
        }

        // Handle remote track
        peerConnection.ontrack = (event) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0]
          }
        }

        // Handle connection state change
        peerConnection.onconnectionstatechange = () => {
          if (peerConnection.connectionState === "connected") {
            setIsConnecting(false)
            setIsConnected(true)

            // Start timer
            timerRef.current = setInterval(() => {
              setDuration((prev) => prev + 1)
            }, 1000)
          }
        }

        // Create and send offer if not incoming call
        if (!isIncoming) {
          const offer = await peerConnection.createOffer()
          await peerConnection.setLocalDescription(offer)

          sendMessage("call:offer", {
            callId,
            offer,
          })
        }

        // Auto answer if specified
        if (isIncoming && autoAnswer) {
          handleAnswer()
        }
      } catch (error) {
        console.error("Error setting up call:", error)
        onEndCall()
      }
    }

    if (socket) {
      setupCall()
    }

    return () => {
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
    }
  }, [socket, callId, sendMessage, isIncoming, autoAnswer, onEndCall])

  // Listen for socket events
  useEffect(() => {
    if (!socket) return

    // Handle incoming offer
    const handleOffer = async (data: { userId: string; offer: RTCSessionDescriptionInit }) => {
      if (data.userId === otherUser.id && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))

        // Create answer
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)

        sendMessage("call:answer-sdp", {
          callId,
          answer,
        })
      }
    }

    // Handle answer
    const handleAnswer = async (data: { userId: string; answer: RTCSessionDescriptionInit }) => {
      if (data.userId === otherUser.id && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
      }
    }

    // Handle ICE candidate
    const handleIceCandidate = (data: { userId: string; candidate: RTCIceCandidateInit }) => {
      if (data.userId === otherUser.id && peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    }

    // Handle call end
    const handleCallEnd = (data: { userId: string }) => {
      if (data.userId === otherUser.id) {
        onEndCall()
      }
    }

    // Subscribe to events
    socket.on("call:offer", handleOffer)
    socket.on("call:answer-sdp", handleAnswer)
    socket.on("call:ice-candidate", handleIceCandidate)
    socket.on("call:end", handleCallEnd)

    // Cleanup
    return () => {
      socket.off("call:offer", handleOffer)
      socket.off("call:answer-sdp", handleAnswer)
      socket.off("call:ice-candidate", handleIceCandidate)
      socket.off("call:end", handleCallEnd)
    }
  }, [socket, callId, otherUser.id, sendMessage, onEndCall])

  // Handle answer call
  const handleAnswer = async () => {
    setIsConnecting(true)

    sendMessage("call:answer", {
      callerId: otherUser.id,
      callId,
      accepted: true,
    })
  }

  // Handle reject call
  const handleReject = () => {
    sendMessage("call:answer", {
      callerId: otherUser.id,
      callId,
      accepted: false,
    })

    onEndCall()
  }

  // Handle end call
  const handleEndCall = () => {
    sendMessage("call:end", {
      callId,
    })

    onEndCall()
  }

  // Handle mute/unmute
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()

      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })

      setIsMuted(!isMuted)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 flex flex-col items-center">
        <audio ref={localAudioRef} autoPlay muted className="hidden" />
        <audio ref={remoteAudioRef} autoPlay className="hidden" />

        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={otherUser.avatarUrl || "/placeholder.svg"} alt={otherUser.fullName} />
          <AvatarFallback className="text-2xl">{otherUser.fullName.charAt(0)}</AvatarFallback>
        </Avatar>

        <h2 className="text-xl font-bold mb-1">{otherUser.fullName}</h2>

        {isConnecting ? (
          <p className="text-gray-500 mb-6">Connecting...</p>
        ) : isConnected ? (
          <p className="text-green-500 mb-6">{formatDuration(duration)}</p>
        ) : (
          <p className="text-gray-500 mb-6">Call ended</p>
        )}

        {isIncoming && !isConnected && !isConnecting ? (
          <div className="flex space-x-4">
            <Button onClick={handleReject} variant="destructive">
              Reject
            </Button>
            <Button onClick={handleAnswer} variant="default">
              Answer
            </Button>
          </div>
        ) : (
          <div className="flex space-x-4">
            <Button
              onClick={handleToggleMute}
              variant="outline"
              className="rounded-full h-12 w-12 p-0"
              disabled={!isConnected}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            <Button onClick={handleEndCall} variant="destructive" className="rounded-full h-12 w-12 p-0">
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
