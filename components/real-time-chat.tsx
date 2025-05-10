"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSocketContext } from "@/context/socket-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Mic, ImageIcon, Paperclip } from "lucide-react"

type Message = {
  id: string
  senderId: string
  receiverId: string
  conversationId: string
  content: string
  type: string
  createdAt: string
  read: boolean
}

type User = {
  id: string
  fullName: string
  avatarUrl?: string
}

type RealTimeChatProps = {
  conversationId: string
  currentUser: User
  otherUser: User
  initialMessages: Message[]
}

export function RealTimeChat({ conversationId, currentUser, otherUser, initialMessages }: RealTimeChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const { socket, isConnected, sendMessage } = useSocketContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Listen for socket events
  useEffect(() => {
    if (!socket) return

    // Handle incoming messages
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message])

        // Mark message as read if it's from the other user
        if (message.senderId === otherUser.id) {
          sendMessage("chat:read", {
            conversationId,
            messageId: message.id,
          })
        }

        // Reset typing indicator
        setOtherUserTyping(false)
      }
    }

    // Handle message read status
    const handleMessageRead = (data: { userId: string; messageId: string; conversationId: string }) => {
      if (data.conversationId === conversationId && data.userId === otherUser.id) {
        setMessages((prev) => prev.map((msg) => (msg.id === data.messageId ? { ...msg, read: true } : msg)))
      }
    }

    // Handle typing indicator
    const handleTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId && data.userId === otherUser.id) {
        setOtherUserTyping(data.isTyping)
      }
    }

    // Subscribe to events
    socket.on("chat:message", handleNewMessage)
    socket.on("chat:read", handleMessageRead)
    socket.on("chat:typing", handleTyping)

    // Cleanup
    return () => {
      socket.off("chat:message", handleNewMessage)
      socket.off("chat:read", handleMessageRead)
      socket.off("chat:typing", handleTyping)
    }
  }, [socket, conversationId, otherUser.id, sendMessage])

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    if (!isTyping) {
      setIsTyping(true)
      sendMessage("chat:typing", {
        conversationId,
        isTyping: true,
      })
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendMessage("chat:typing", {
        conversationId,
        isTyping: false,
      })
    }, 2000)
  }

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return

    const messageData = {
      conversationId,
      receiverId: otherUser.id,
      content: newMessage.trim(),
      type: "text",
    }

    // Send message via socket
    sendMessage("chat:message", messageData)

    // Clear input
    setNewMessage("")

    // Reset typing indicator
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    sendMessage("chat:typing", {
      conversationId,
      isTyping: false,
    })
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
            >
              {message.senderId !== currentUser.id && (
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={otherUser.avatarUrl || "/placeholder.svg"} alt={otherUser.fullName} />
                  <AvatarFallback>{otherUser.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div>
                <Card
                  className={`max-w-md ${
                    message.senderId === currentUser.id ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <CardContent className="p-3">
                    <p>{message.content}</p>
                  </CardContent>
                </Card>
                <div
                  className={`text-xs text-gray-500 mt-1 flex items-center ${
                    message.senderId === currentUser.id ? "justify-end" : "justify-start"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {message.senderId === currentUser.id && (
                    <span className="ml-1">{message.read ? " • Read" : " • Sent"}</span>
                  )}
                </div>
              </div>
              {message.senderId === currentUser.id && (
                <Avatar className="h-8 w-8 ml-2">
                  <AvatarImage src={currentUser.avatarUrl || "/placeholder.svg"} alt={currentUser.fullName} />
                  <AvatarFallback>{currentUser.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {otherUserTyping && (
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={otherUser.avatarUrl || "/placeholder.svg"} alt={otherUser.fullName} />
                <AvatarFallback>{otherUser.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <Card className="bg-gray-100 dark:bg-gray-800">
                <CardContent className="p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Mic className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim() || !isConnected}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
        {!isConnected && (
          <p className="text-xs text-red-500 mt-1">Not connected to server. Messages will not be sent.</p>
        )}
      </div>
    </div>
  )
}
