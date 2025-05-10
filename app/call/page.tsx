"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PhoneCall, PhoneOff, SkipForward, Mic, MicOff, User, GamepadIcon, Dices } from "lucide-react"
import { useNotifications } from "@/components/notification-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DrawingCanvas } from "@/components/drawing-canvas"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

// Import the expanded artist names
import { koreanArtistNames, indonesianArtistNames } from "@/data/artist-names"

// Game topics for the random question feature in different languages
const gameTopics = {
  english: [
    "If you could travel anywhere in the world, where would you go and why?",
    "What's your favorite movie of all time?",
    "If you could have any superpower, what would it be?",
    "What's the best book you've ever read?",
    "If you could have dinner with any historical figure, who would it be?",
    "What's your dream job?",
    "What's the most adventurous thing you've ever done?",
    "If you could learn any skill instantly, what would it be?",
    "What's your favorite way to spend a weekend?",
    "If you could live in any fictional world, which one would you choose?",
  ],
  indonesian: [
    "Jika kamu bisa pergi ke mana saja di dunia, ke mana kamu akan pergi dan mengapa?",
    "Apa film favoritmu sepanjang masa?",
    "Jika kamu bisa memiliki kekuatan super, apa yang akan kamu pilih?",
    "Apa buku terbaik yang pernah kamu baca?",
    "Jika kamu bisa makan malam dengan tokoh sejarah, siapa yang akan kamu pilih?",
    "Apa pekerjaan impianmu?",
    "Apa hal paling petualang yang pernah kamu lakukan?",
    "Jika kamu bisa menguasai keterampilan apa pun secara instan, apa yang akan kamu pilih?",
    "Apa cara favoritmu untuk menghabiskan akhir pekan?",
    "Jika kamu bisa tinggal di dunia fiksi mana pun, mana yang akan kamu pilih?",
  ],
}

// Pictionary words for guessing game
const pictionaryWords = [
  "cat",
  "dog",
  "house",
  "tree",
  "car",
  "sun",
  "moon",
  "star",
  "flower",
  "book",
  "computer",
  "phone",
  "chair",
  "table",
  "cup",
  "bottle",
  "shoe",
  "hat",
  "glasses",
  "clock",
  "beach",
  "mountain",
  "river",
  "forest",
  "city",
  "airplane",
  "boat",
  "train",
  "bicycle",
  "guitar",
  "pizza",
  "hamburger",
  "ice cream",
  "cake",
  "apple",
  "banana",
  "soccer",
  "basketball",
  "tennis",
  "swimming",
]

// Online users simulation
const onlineUsers = [
  { id: 1, name: "User 1", location: "Jakarta, Indonesia" },
  { id: 2, name: "User 2", location: "Bandung, Indonesia" },
  { id: 3, name: "User 3", location: "Surabaya, Indonesia" },
  { id: 4, name: "User 4", location: "Yogyakarta, Indonesia" },
  { id: 5, name: "User 5", location: "Bali, Indonesia" },
]

export default function CallPage() {
  const router = useRouter()
  const { addNotification } = useNotifications()
  const [callState, setCallState] = useState<"waiting" | "searching" | "pairing" | "connected" | "ended">("waiting")
  const [timeLeft, setTimeLeft] = useState(480) // 8 minutes in seconds
  const [isMuted, setIsMuted] = useState(false)
  const [callerName, setCallerName] = useState("")
  const [onlineCount, setOnlineCount] = useState(0)
  const [pairingWith, setPairingWith] = useState<string | null>(null)
  const [isDrawingGameOpen, setIsDrawingGameOpen] = useState(false)
  const [currentWord, setCurrentWord] = useState("")
  const [isGuessing, setIsGuessing] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("english")
  const [showRandomTopic, setShowRandomTopic] = useState(false)
  const [randomTopic, setRandomTopic] = useState("")
  const [showGuidelines, setShowGuidelines] = useState(true)
  const lastNameChangeRef = useRef<Date | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Set random online count between 15-50
    setOnlineCount(Math.floor(Math.random() * 35) + 15)

    // Start in waiting state
    setCallState("waiting")

    // Check when the last name change occurred
    const lastNameChange = localStorage.getItem("lastNameChange")
    if (lastNameChange) {
      lastNameChangeRef.current = new Date(lastNameChange)
    }

    // Initialize audio context for clear voice calling
    if (typeof window !== "undefined") {
      audioRef.current = new Audio()
      // In a real app, this would be connected to WebRTC
    }
  }, [])

  useEffect(() => {
    if (callState === "waiting") {
      // After 2 seconds, move to searching state
      const waitTimer = setTimeout(() => {
        if (showGuidelines) return // Don't proceed if guidelines are still shown
        setCallState("searching")
      }, 2000)
      return () => clearTimeout(waitTimer)
    }

    if (callState === "searching") {
      // After 2 seconds, move to pairing state
      const searchTimer = setTimeout(() => {
        // Randomly select a user to pair with
        const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)]
        setPairingWith(randomUser.name)
        setCallState("pairing")
      }, 2000)
      return () => clearTimeout(searchTimer)
    }

    if (callState === "pairing") {
      // After 2 seconds, move to connected state
      const pairTimer = setTimeout(() => {
        // Check if it's time to change the artist name (every hour)
        const now = new Date()
        let shouldChangeArtistPool = true

        if (lastNameChangeRef.current) {
          const hoursSinceLastChange = (now.getTime() - lastNameChangeRef.current.getTime()) / (1000 * 60 * 60)
          shouldChangeArtistPool = hoursSinceLastChange >= 1
        }

        if (shouldChangeArtistPool) {
          // Update the last name change time
          lastNameChangeRef.current = now
          localStorage.setItem("lastNameChange", now.toISOString())
        }

        // Randomly select either a Korean idol or Indonesian artist name
        const useKoreanName = Math.random() > 0.5
        const nameList = useKoreanName ? koreanArtistNames : indonesianArtistNames
        const randomName = nameList[Math.floor(Math.random() * nameList.length)]
        setCallerName(randomName)
        setCallState("connected")

        // Simulate clear voice connection
        if (audioRef.current) {
          // In a real app, this would be connected to WebRTC
          // For simulation, we'll just log that high-quality audio is enabled
          console.log("High-quality audio connection established")
        }

        // Send notification
        addNotification({
          title: "Call Connected",
          description: `You are now connected with ${randomName}`,
          type: "success",
        })
      }, 2000)
      return () => clearTimeout(pairTimer)
    }

    if (callState !== "connected") return

    // Start the 8-minute timer when connected
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCallState("ended")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [callState, addNotification, showGuidelines])

  const handleEndCall = () => {
    setCallState("ended")
  }

  const handleSkip = () => {
    setCallState("searching")
    setTimeLeft(480)
    setPairingWith(null)

    // Send notification
    addNotification({
      title: "Looking for new call",
      description: "Searching for a new person to talk to...",
      type: "info",
    })
  }

  const handleFriendRequest = (accept: boolean) => {
    if (accept) {
      // Send notification
      addNotification({
        title: "Friend Request Sent",
        description: `You sent a friend request to ${callerName}`,
        type: "success",
      })
      router.push("/chats/new")
    } else {
      router.push("/dashboard")
    }
  }

  const handleStartCall = () => {
    setShowGuidelines(false)
    setCallState("searching")
  }

  const startDrawingGame = () => {
    // Generate a random word
    const randomWord = pictionaryWords[Math.floor(Math.random() * pictionaryWords.length)]
    setCurrentWord(randomWord)
    setIsGuessing(false)
    setIsDrawingGameOpen(true)

    // Send notification
    addNotification({
      title: "Drawing Game Started",
      description: `Your word to draw is: ${randomWord}`,
      type: "info",
    })
  }

  const handleSaveDrawing = (imageData: string) => {
    // In a real app, you would send this to the other person
    console.log("Drawing saved:", imageData)
    setIsDrawingGameOpen(false)

    // Send notification
    addNotification({
      title: "Drawing Sent",
      description: "Your drawing has been sent to the other person.",
      type: "success",
    })
  }

  const generateRandomTopic = () => {
    const topics = gameTopics[selectedLanguage as keyof typeof gameTopics]
    const newRandomTopic = topics[Math.floor(Math.random() * topics.length)]
    setRandomTopic(newRandomTopic)
    setShowRandomTopic(true)

    // Send notification
    addNotification({
      title: "New Topic Generated",
      description: "A new conversation topic has been generated.",
      type: "info",
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 container flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            {showGuidelines && callState === "waiting" && (
              <div className="flex flex-col items-center space-y-4 py-6">
                <Alert className="bg-blue-50 text-blue-800 border-blue-200 mb-4">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Community Guidelines</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Be respectful to everyone you talk with</li>
                      <li>Do not engage in inappropriate or offensive behavior</li>
                      <li>Bullying and harassment are strictly prohibited</li>
                      <li>Report any violations immediately</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <Button className="bg-rose-600 hover:bg-rose-700" onClick={handleStartCall}>
                  I Understand, Start Call
                </Button>
              </div>
            )}

            {!showGuidelines && callState === "waiting" && (
              <div className="flex flex-col items-center space-y-4 py-12">
                <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center">
                  <PhoneCall className="h-12 w-12 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold">Start a Random Call</h2>
                <p className="text-gray-500 text-center">Connect with random people for an 8-minute anonymous call.</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-green-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></span>
                  <span>{onlineCount} people online now</span>
                </div>
                <Button className="bg-rose-600 hover:bg-rose-700" onClick={handleStartCall}>
                  Start Call
                </Button>
              </div>
            )}

            {callState === "searching" && (
              <div className="flex flex-col items-center space-y-4 py-12">
                <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center animate-pulse">
                  <PhoneCall className="h-12 w-12 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold">Finding someone to talk to...</h2>
                <p className="text-gray-500">Please wait while we connect you with someone.</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-green-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></span>
                  <span>{onlineCount} people online now</span>
                </div>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
              </div>
            )}

            {callState === "pairing" && (
              <div className="flex flex-col items-center space-y-4 py-12">
                <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center">
                  <PhoneCall className="h-12 w-12 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold">Connecting with {pairingWith}...</h2>
                <div className="w-full max-w-xs">
                  <Progress value={66} className="h-2" />
                </div>
                <p className="text-gray-500">Establishing high-quality voice connection...</p>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
              </div>
            )}

            {callState === "connected" && (
              <div className="flex flex-col items-center space-y-6">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-16 w-16 text-gray-500" />
                </div>
                <h2 className="text-xl font-bold">{callerName}</h2>

                <div className="w-full space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Time remaining</span>
                    <span className="text-sm font-medium">{formatTime(timeLeft)}</span>
                  </div>
                  <Progress value={(timeLeft / 480) * 100} className="h-2" />
                </div>

                {showRandomTopic && (
                  <div className="bg-yellow-50 p-3 rounded-lg w-full text-center">
                    <p className="text-sm font-medium">Topic: {randomTopic}</p>
                  </div>
                )}

                <div className="flex space-x-3 mt-2">
                  <select
                    className="text-sm border rounded p-1"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="english">English</option>
                    <option value="indonesian">Indonesian</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={generateRandomTopic}>
                    <Dices className="h-4 w-4 mr-2" />
                    Random Topic
                  </Button>
                  <Button variant="outline" size="sm" onClick={startDrawingGame}>
                    <GamepadIcon className="h-4 w-4 mr-2" />
                    Drawing Game
                  </Button>
                </div>

                <div className="flex space-x-4 mt-6">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={handleEndCall}>
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={handleSkip}>
                    <SkipForward className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            )}

            {callState === "ended" && (
              <div className="flex flex-col items-center space-y-6 py-8">
                <h2 className="text-xl font-bold">Call Ended</h2>
                <p className="text-center text-gray-500">Would you like to become friends with {callerName}?</p>

                <div className="flex space-x-4 mt-4">
                  <Button variant="outline" onClick={() => handleFriendRequest(false)}>
                    No Thanks
                  </Button>
                  <Button className="bg-rose-600 hover:bg-rose-700" onClick={() => handleFriendRequest(true)}>
                    Add Friend
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDrawingGameOpen} onOpenChange={setIsDrawingGameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Drawing Game: Draw "{currentWord}"</DialogTitle>
          </DialogHeader>
          <DrawingCanvas onSave={handleSaveDrawing} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
