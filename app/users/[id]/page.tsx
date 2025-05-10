"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MapPin, PhoneCall, MessageSquare, User } from "lucide-react"

// Sample user data - in a real app, this would come from a database
const sampleUsers = [
  {
    id: "1",
    name: "Raisa",
    realName: "Raisa Andriana",
    age: 28,
    gender: "female",
    bio: "Singer and songwriter from Jakarta. Love meeting new people!",
    location: "Jakarta, Indonesia",
  },
  {
    id: "2",
    name: "Jungkook (BTS)",
    realName: "Jeon Jungkook",
    age: 25,
    gender: "male",
    bio: "Music enthusiast and traveler. Always looking for new adventures!",
    location: "Seoul, South Korea",
  },
  {
    id: "3",
    name: "Isyana Sarasvati",
    realName: "Isyana Sarasvati",
    age: 30,
    gender: "female",
    bio: "Classical musician and pop singer. Love discussing music and arts.",
    location: "Bandung, Indonesia",
  },
]

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isFriend, setIsFriend] = useState(false)

  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll just simulate loading from our sample data
    setLoading(true)
    setTimeout(() => {
      const foundUser = sampleUsers.find((u) => u.id === userId) || {
        id: userId,
        name: `User ${userId}`,
        realName: `Real Name ${userId}`,
        age: 25,
        gender: "prefer-not-to-say",
        bio: "This user hasn't added a bio yet.",
        location: "Unknown location",
      }
      setUser(foundUser)

      // Check if this user is a friend
      const savedRequests = localStorage.getItem("friendRequests")
      if (savedRequests) {
        const friendRequests = JSON.parse(savedRequests)
        setIsFriend(friendRequests[userId] === "friends")
      }

      setLoading(false)
    }, 1000)
  }, [userId])

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-rose-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading user profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">User Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-12 w-12 text-gray-500" />
            </div>
          </div>
          <CardTitle className="text-center">{isFriend ? user.realName : user.name}</CardTitle>
          <CardDescription className="text-center">
            {user.age} years old • {user.gender}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">About</h3>
            <p className="text-gray-600">{user.bio}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Location</h3>
            <p className="text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              {user.location}
            </p>
          </div>

          {isFriend && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700 flex items-center">
                <User className="h-4 w-4 mr-2" />
                You are friends with this user
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => router.push("/call")}>
            <PhoneCall className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button className="bg-rose-600 hover:bg-rose-700" onClick={() => router.push(`/chats/${userId}`)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
