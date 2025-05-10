"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User, MapPin, UserPlus, UserCheck, UserX, Bell } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/components/notification-provider"

// Sample nearby users data - in a real app, this would come from a database
const sampleNearbyUsers = [
  {
    id: "1",
    name: "Raisa",
    realName: "Raisa Andriana",
    age: 28,
    gender: "female",
    location: "Jakarta, Indonesia",
    distance: 2.5,
  },
  {
    id: "2",
    name: "Jungkook (BTS)",
    realName: "Jeon Jungkook",
    age: 25,
    gender: "male",
    location: "Bandung, Indonesia",
    distance: 5.1,
  },
  {
    id: "3",
    name: "Isyana Sarasvati",
    realName: "Isyana Sarasvati",
    age: 30,
    gender: "female",
    location: "Jakarta, Indonesia",
    distance: 3.2,
  },
  {
    id: "4",
    name: "V (BTS)",
    realName: "Kim Taehyung",
    age: 26,
    gender: "male",
    location: "Surabaya, Indonesia",
    distance: 8.7,
  },
  {
    id: "5",
    name: "Tulus",
    realName: "Muhammad Tulus",
    age: 32,
    gender: "male",
    location: "Yogyakarta, Indonesia",
    distance: 10.3,
  },
  {
    id: "6",
    name: "Lisa (BLACKPINK)",
    realName: "Lalisa Manoban",
    age: 24,
    gender: "female",
    location: "Bali, Indonesia",
    distance: 15.8,
  },
]

// Sample friend requests data
const sampleFriendRequests = [
  {
    id: "7",
    name: "Jennie (BLACKPINK)",
    realName: "Jennie Kim",
    age: 26,
    gender: "female",
    location: "Jakarta, Indonesia",
    requestTime: "2 hours ago",
  },
  {
    id: "8",
    name: "RM (BTS)",
    realName: "Kim Namjoon",
    age: 28,
    gender: "male",
    location: "Bandung, Indonesia",
    requestTime: "1 day ago",
  },
  {
    id: "9",
    name: "Agnez Mo",
    realName: "Agnes Monica",
    age: 34,
    gender: "female",
    location: "Jakarta, Indonesia",
    requestTime: "3 days ago",
  },
]

// Sample active users data
const sampleActiveUsers = [
  {
    id: "10",
    name: "Jisoo (BLACKPINK)",
    realName: "Kim Jisoo",
    age: 27,
    gender: "female",
    location: "Surabaya, Indonesia",
    lastActive: "Just now",
  },
  {
    id: "11",
    name: "J-Hope (BTS)",
    realName: "Jung Hoseok",
    age: 28,
    gender: "male",
    location: "Bandung, Indonesia",
    lastActive: "5 minutes ago",
  },
  {
    id: "12",
    name: "Rizky Febian",
    realName: "Rizky Febian Adriansyah",
    age: 23,
    gender: "male",
    location: "Jakarta, Indonesia",
    lastActive: "15 minutes ago",
  },
  {
    id: "13",
    name: "Rosé (BLACKPINK)",
    realName: "Park Chaeyoung",
    age: 25,
    gender: "female",
    location: "Yogyakarta, Indonesia",
    lastActive: "30 minutes ago",
  },
]

export default function NearbyPage() {
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [friendRequestStatus, setFriendRequestStatus] = useState<Record<string, string>>({})
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const { addNotification } = useNotifications()

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would use a geocoding service to get the city name
          // For now, we'll just set a default location
          setUserLocation("Jakarta, Indonesia")
        },
        (error) => {
          console.error("Error getting location:", error)
          setUserLocation("Unknown location")
        },
      )
    }

    // In a real app, this would be an API call to get nearby users
    // For now, we'll just use our sample data
    setLoading(true)
    setTimeout(() => {
      // Load any existing friend request states from localStorage
      const savedRequests = localStorage.getItem("friendRequests")
      if (savedRequests) {
        setFriendRequestStatus(JSON.parse(savedRequests))
      }

      setNearbyUsers(sampleNearbyUsers)
      setFriendRequests(sampleFriendRequests)
      setActiveUsers(sampleActiveUsers)
      setLoading(false)
    }, 1500)
  }, [])

  const handleFriendRequest = (userId: string, action: "send" | "cancel" | "accept" | "reject") => {
    let newStatus = ""

    switch (action) {
      case "send":
        newStatus = "pending"
        addNotification({
          title: "Friend Request Sent",
          description: "Your friend request has been sent successfully.",
          type: "success",
        })
        break
      case "cancel":
        newStatus = ""
        addNotification({
          title: "Friend Request Cancelled",
          description: "Your friend request has been cancelled.",
          type: "info",
        })
        break
      case "accept":
        newStatus = "friends"
        addNotification({
          title: "Friend Request Accepted",
          description: "You are now friends! You can see their real name and chat with them.",
          type: "success",
        })
        // Remove from friend requests list
        setFriendRequests((prev) => prev.filter((request) => request.id !== userId))
        break
      case "reject":
        newStatus = "rejected"
        addNotification({
          title: "Friend Request Rejected",
          description: "The friend request has been rejected.",
          type: "info",
        })
        // Remove from friend requests list
        setFriendRequests((prev) => prev.filter((request) => request.id !== userId))
        break
    }

    const updatedRequests = { ...friendRequestStatus, [userId]: newStatus }
    setFriendRequestStatus(updatedRequests)

    // Save to localStorage (in a real app, this would be saved to a database)
    localStorage.setItem("friendRequests", JSON.stringify(updatedRequests))
  }

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-rose-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Finding people nearby...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">People Nearby</h1>
        {userLocation && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            Your location: {userLocation}
          </div>
        )}
      </div>

      <Tabs defaultValue="nearby">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="nearby" className="flex-1">
            Nearby Users
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 relative">
            Friend Requests
            {friendRequests.length > 0 && (
              <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                {friendRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1">
            Active Now
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nearby">
          {nearbyUsers.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No one nearby</h3>
              <p className="mt-2 text-sm text-gray-500">Try again later or expand your search radius.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nearbyUsers.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="h-8 w-8 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {friendRequestStatus[user.id] === "friends" ? user.realName : user.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {user.age} • {user.gender}
                              </p>
                            </div>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {user.distance.toFixed(1)} km
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {user.location}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t p-3 flex justify-between">
                      <Link href={`/users/${user.id}`}>
                        <Button variant="ghost" size="sm">
                          View Profile
                        </Button>
                      </Link>

                      {!friendRequestStatus[user.id] && (
                        <Button
                          size="sm"
                          className="bg-rose-600 hover:bg-rose-700"
                          onClick={() => handleFriendRequest(user.id, "send")}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Friend
                        </Button>
                      )}

                      {friendRequestStatus[user.id] === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => handleFriendRequest(user.id, "cancel")}>
                          <UserX className="h-4 w-4 mr-2" />
                          Cancel Request
                        </Button>
                      )}

                      {friendRequestStatus[user.id] === "friends" && (
                        <Button variant="outline" size="sm" className="text-green-600 border-green-600">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Friends
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {friendRequests.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No friend requests</h3>
              <p className="mt-2 text-sm text-gray-500">
                When someone sends you a friend request, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friendRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="h-8 w-8 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{request.name}</h3>
                              <p className="text-sm text-gray-500">
                                {request.age} • {request.gender}
                              </p>
                            </div>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{request.requestTime}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {request.location}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t p-3 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFriendRequest(request.id, "reject")}
                        className="text-red-600"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleFriendRequest(request.id, "accept")}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {activeUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No active users</h3>
              <p className="mt-2 text-sm text-gray-500">When people are active in your area, they will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeUsers.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 relative">
                          <User className="h-8 w-8 text-gray-500" />
                          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {friendRequestStatus[user.id] === "friends" ? user.realName : user.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {user.age} • {user.gender}
                              </p>
                            </div>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {user.lastActive}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {user.location}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t p-3 flex justify-between">
                      <Link href={`/users/${user.id}`}>
                        <Button variant="ghost" size="sm">
                          View Profile
                        </Button>
                      </Link>

                      {!friendRequestStatus[user.id] && (
                        <Button
                          size="sm"
                          className="bg-rose-600 hover:bg-rose-700"
                          onClick={() => handleFriendRequest(user.id, "send")}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Friend
                        </Button>
                      )}

                      {friendRequestStatus[user.id] === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => handleFriendRequest(user.id, "cancel")}>
                          <UserX className="h-4 w-4 mr-2" />
                          Cancel Request
                        </Button>
                      )}

                      {friendRequestStatus[user.id] === "friends" && (
                        <Button variant="outline" size="sm" className="text-green-600 border-green-600">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Friends
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
