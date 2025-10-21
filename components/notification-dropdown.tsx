"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell } from "lucide-react"
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/tickets"
import useSWR from "swr"
import type { Notification } from "@/lib/db"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function NotificationDropdown() {
  const { data, mutate } = useSWR<Notification[]>("/api/notifications", fetcher, {
    refreshInterval: 10000, // Poll every 10 seconds
  })

  const notifications = data || []
  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleMarkRead(notificationId: string) {
    await markNotificationRead(notificationId)
    mutate()
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead()
    mutate()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-2 border-b">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto py-1 px-2 text-xs">
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                onClick={() => handleMarkRead(notification.id)}
                asChild
              >
                <Link href={notification.ticket_id ? `/tickets/${notification.ticket_id}` : "/tickets"}>
                  <div className="flex items-start justify-between w-full gap-2">
                    <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>{notification.message}</p>
                    {!notification.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
