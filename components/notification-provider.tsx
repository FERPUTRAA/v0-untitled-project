"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ToastAction } from "@/components/ui/toast"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

type NotificationType = {
  id: string
  title: string
  description: string
  type: "info" | "success" | "warning" | "error"
  action?: {
    label: string
    onClick: () => void
  }
}

type NotificationContextType = {
  notifications: NotificationType[]
  addNotification: (notification: Omit<NotificationType, "id">) => void
  removeNotification: (id: string) => void
  unreadCount: number
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()

  // Simulate receiving notifications from a server
  useEffect(() => {
    // Check localStorage for existing notifications
    const storedNotifications = localStorage.getItem("notifications")
    if (storedNotifications) {
      const parsedNotifications = JSON.parse(storedNotifications)
      setNotifications(parsedNotifications)
      setUnreadCount(parsedNotifications.length)
    }

    // Set up a simulated "real-time" notification system
    const notificationInterval = setInterval(() => {
      // 10% chance of receiving a notification every 30 seconds
      if (Math.random() < 0.1) {
        const newNotification = {
          id: Date.now().toString(),
          title: "New Activity",
          description: "Someone is looking for a call nearby!",
          type: "info" as const,
        }

        setNotifications((prev) => {
          const updated = [...prev, newNotification]
          localStorage.setItem("notifications", JSON.stringify(updated))
          return updated
        })

        setUnreadCount((prev) => prev + 1)

        // Show toast notification
        toast({
          title: newNotification.title,
          description: newNotification.description,
        })
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(notificationInterval)
  }, [toast])

  const addNotification = (notification: Omit<NotificationType, "id">) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
    }

    setNotifications((prev) => {
      const updated = [...prev, newNotification]
      localStorage.setItem("notifications", JSON.stringify(updated))
      return updated
    })

    setUnreadCount((prev) => prev + 1)

    // Show toast notification
    toast({
      title: newNotification.title,
      description: newNotification.description,
      action: notification.action ? (
        <ToastAction altText={notification.action.label} onClick={notification.action.onClick}>
          {notification.action.label}
        </ToastAction>
      ) : undefined,
    })
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((notification) => notification.id !== id)
      localStorage.setItem("notifications", JSON.stringify(updated))
      return updated
    })
  }

  const markAllAsRead = () => {
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        unreadCount,
        markAllAsRead,
      }}
    >
      {children}
      <Toaster />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
