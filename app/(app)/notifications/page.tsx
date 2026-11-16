'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getNotifications, markRead, markAllRead } from '@/lib/services/notifications'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck } from 'lucide-react'
import type { Notification } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

const linkPaths: Record<string, string> = {
  order: '/orders',
  enquiry: '/enquiries',
  grn: '/inventory/purchases',
  payment: '/payments',
  picklist: '/picking',
  adjustment: '/inventory/adjustments',
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(setNotifications).finally(() => setLoading(false))
    }
  }, [user])

  async function handleMarkRead(n: Notification) {
    if (!n.read) {
      await markRead(n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    const basePath = linkPaths[n.linkType]
    if (basePath) {
      const path = n.linkId ? `${basePath}/${n.linkId}` : basePath
      router.push(path)
    }
  }

  async function handleMarkAllRead() {
    if (!user) return
    await markAllRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No notifications</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleMarkRead(n)}
              className={`w-full text-left rounded-lg px-4 py-3 transition-colors hover:bg-muted/50 ${
                !n.read ? 'bg-primary/5 border border-primary/10' : 'border border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  {linkPaths[n.linkType] && (
                    <Badge variant="outline" className="text-[10px] mt-1.5 capitalize">
                      {n.linkType}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
