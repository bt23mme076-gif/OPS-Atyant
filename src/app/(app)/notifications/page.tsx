'use client'
import { Bell, CheckCheck } from 'lucide-react'
import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from '@/store/api/dashboardApi'
import { Button, Spinner, Empty } from '@/components/ui'
import { formatRelative } from '@/lib/utils'

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useGetNotificationsQuery()
  const [markRead]    = useMarkNotificationReadMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()
  const unread = notifications.filter(n => !n.isRead)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllRead()}><CheckCheck size={13} /> Mark all read</Button>
        )}
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner /></div> :
       notifications.length === 0 ? <Empty icon={<Bell size={32} />} title="All caught up!" description="No notifications" /> : (
        <div className="card divide-y divide-gray-50">
          {notifications.map(n => (
            <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-gray-200'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n.id)} className="text-[10px] text-blue-500 hover:text-blue-700 flex-shrink-0">Mark read</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
