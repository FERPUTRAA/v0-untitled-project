"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PhoneCall, MessageSquare, User, Users, Search } from "lucide-react"

export default function ChatsPage() {
  const chatList = [
    { id: 1, name: "Friend 1", lastMessage: "Hey, how are you?", time: "10:30 AM" },
    { id: 2, name: "Friend 2", lastMessage: "Let's play a game!", time: "Yesterday" },
    { id: 3, name: "Friend 3", lastMessage: "That was a fun call", time: "2 days ago" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-2xl font-bold">Chats</h1>
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input className="pl-10" placeholder="Search chats..." />
        </div>

        <div className="space-y-4">
          {chatList.map((chat) => (
            <Link href={`/chats/${chat.id}`} key={chat.id}>
              <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{chat.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">{chat.lastMessage}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{chat.time}</div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {chatList.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No chats yet</h3>
              <p className="mt-2 text-sm text-gray-500">Start a random call to meet new people and make friends!</p>
              <Link href="/call" className="mt-4 inline-block">
                <Button>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Start Random Call
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <nav className="sticky bottom-0 border-t bg-background">
        <div className="container">
          <div className="flex h-16 items-center justify-around">
            <Link href="/dashboard">
              <Button variant="ghost" className="flex flex-col h-full items-center justify-center px-4">
                <Users className="h-5 w-5" />
                <span className="text-xs mt-1">Friends</span>
              </Button>
            </Link>
            <Link href="/call">
              <Button className="flex flex-col h-12 w-12 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-700">
                <PhoneCall className="h-6 w-6 text-white" />
              </Button>
            </Link>
            <Link href="/chats">
              <Button variant="ghost" className="flex flex-col h-full items-center justify-center px-4">
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs mt-1">Chats</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
