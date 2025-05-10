"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/components/notification-provider"
import { useRouter } from "next/navigation"

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, removeNotification } = useNotifications()
  const router = useRouter()

  const handleOpen = () => {
    markAllAsRead()
  }

  const handleNotificationClick = (notification: any) => {
    // Handle notification click based on type
    if (notification.action?.onClick) {
      notification.action.onClick()
    }
    removeNotification(notification.id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" onOpenAutoFocus={handleOpen}>
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="p-3 cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <div>
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-gray-500">{notification.description}</div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
