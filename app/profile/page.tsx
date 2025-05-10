"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, LogOut, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Default emoji profile pictures
const defaultEmojis = [
  "😀",
  "😎",
  "🤩",
  "🥳",
  "😊",
  "🤗",
  "🦄",
  "🐱",
  "🐶",
  "🦊",
  "🐼",
  "🐨",
  "🦁",
  "🐯",
  "🐮",
  "🐷",
  "🐸",
  "🐙",
  "🦋",
  "🦉",
]

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState("John Doe")
  const [bio, setBio] = useState("I love meeting new people and having interesting conversations!")
  const [location, setLocation] = useState("Jakarta, Indonesia")
  const [shareLocation, setShareLocation] = useState(true)
  const [age, setAge] = useState("25")
  const [gender, setGender] = useState("male")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [profilePicture, setProfilePicture] = useState<string>("😀")
  const [lastProfileChange, setLastProfileChange] = useState<Date | null>(null)
  const [canChangeProfile, setCanChangeProfile] = useState(true)
  const [daysUntilChange, setDaysUntilChange] = useState(0)

  useEffect(() => {
    // Load user data from localStorage
    const storedName = localStorage.getItem("userName")
    const storedEmail = localStorage.getItem("userEmail")
    const storedPicture = localStorage.getItem("profilePicture")
    const storedLastChange = localStorage.getItem("lastProfileChange")

    if (storedName) setName(storedName)
    if (storedPicture) setProfilePicture(storedPicture)

    // Check if user can change profile picture
    if (storedLastChange) {
      const lastChange = new Date(storedLastChange)
      const now = new Date()
      const diffTime = now.getTime() - lastChange.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      setLastProfileChange(lastChange)

      if (diffDays < 13) {
        setCanChangeProfile(false)
        setDaysUntilChange(13 - diffDays)
      } else {
        setCanChangeProfile(true)
      }
    }

    // Request location permission when shareLocation is true
    if (shareLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          // In a real app, you would use a geocoding service to get the location name
          // For now, we'll just use the coordinates
          setLocation(
            `Latitude: ${position.coords.latitude.toFixed(4)}, Longitude: ${position.coords.longitude.toFixed(4)}`,
          )
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }, [shareLocation])

  const handleSave = () => {
    // Save user data to localStorage
    localStorage.setItem("userName", name)
    localStorage.setItem("userAge", age)
    localStorage.setItem("userGender", gender)
    localStorage.setItem("userBio", bio)
    localStorage.setItem("userLocation", location)
    localStorage.setItem("userShareLocation", shareLocation.toString())

    alert("Profile saved!")
    router.push("/dashboard")
  }

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")

    router.push("/auth/login")
  }

  const handleRequestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          // In a real app, you would use a geocoding service to get the location name
          setLocation(
            `Latitude: ${position.coords.latitude.toFixed(4)}, Longitude: ${position.coords.longitude.toFixed(4)}`,
          )
        },
        (error) => {
          console.error("Error getting location:", error)
          alert("Could not get your location. Please check your browser permissions.")
        },
      )
    } else {
      alert("Geolocation is not supported by your browser")
    }
  }

  const changeProfilePicture = (emoji: string) => {
    if (!canChangeProfile) return

    setProfilePicture(emoji)
    localStorage.setItem("profilePicture", emoji)
    localStorage.setItem("lastProfileChange", new Date().toISOString())

    setCanChangeProfile(false)
    setDaysUntilChange(13)
    setLastProfileChange(new Date())
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Manage your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl mb-2">
              {profilePicture}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" disabled={!canChangeProfile}>
                  Change Profile Picture
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="grid grid-cols-5 gap-2">
                  {defaultEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      className={`text-2xl p-2 hover:bg-gray-100 rounded ${!canChangeProfile ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => changeProfilePicture(emoji)}
                      disabled={!canChangeProfile}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {!canChangeProfile && (
              <p className="text-xs text-gray-500 mt-1">
                You can change your profile picture again in {daysUntilChange} days
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} min="13" max="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="location">Location</Label>
              <Button variant="outline" size="sm" onClick={handleRequestLocation}>
                <MapPin className="h-4 w-4 mr-2" />
                Get Current Location
              </Button>
            </div>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-location">Share Location</Label>
              <p className="text-sm text-gray-500">Allow others to see your general location</p>
            </div>
            <Switch id="share-location" checked={shareLocation} onCheckedChange={setShareLocation} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="outline" className="w-full text-red-500 hover:text-red-600" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
