'use client'

import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ClipboardList,
  Info,
  Sparkles,
} from 'lucide-react'
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/api/dashboardApi'
import { Button, Spinner, Empty } from '@/components/ui'
import { formatRelative, cn } from '@/lib/utils'

function getNotificationMeta(title: string, message: string) {
  const text = `${title} ${message}`.toLowerCase()

  if (text.includes('task') || text.includes('assigned')) {
    return {
      label: 'Task',
      icon: ClipboardList,
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-l-purple-500',
    }
  }

  if (text.includes('complete') || text.includes('approved') || text.includes('done')) {
    return {
      label: 'Update',
      icon: CheckCircle2,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-l-emerald-500',
    }
  }

  if (text.includes('due') || text.includes('overdue') || text.includes('deadline')) {
    return {
      label: 'Reminder',
      icon: Clock,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-l-amber-500',
    }
  }

  return {
    label: 'Info',
    icon: Info,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-l-blue-500',
  }
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useGetNotificationsQuery()
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()

  const unread = notifications.filter(n => !n.isRead)
  const read = notifications.filter(n => n.isRead)
  const taskNotifications = notifications.filter(n => {
    const text = `${n.title} ${n.message}`.toLowerCase()
    return text.includes('task') || text.includes('assigned')
  })

  return (
    <div className="max-w-[920px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Notifications
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Track task assignments, reminders, and updates
              </p>
            </div>
          </div>
        </div>

        {unread.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllRead()}>
            <CheckCheck size={14} />
            Mark all read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Unread
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{unread.length}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Task Alerts
          </p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {taskNotifications.length}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Total
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {notifications.length}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <Empty
            icon={<Bell size={34} />}
            title="All caught up!"
            description="No notifications yet. Task assignment alerts will appear here."
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Recent notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {unread.length} unread · {read.length} read
              </p>
            </div>

            {unread.length > 0 && (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                {unread.length} new
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            {notifications.map(n => {
              const meta = getNotificationMeta(n.title, n.message)
              const Icon = meta.icon

              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-4 px-5 py-4 border-l-4 transition-all',
                    !n.isRead
                      ? `${meta.border} bg-blue-50/30`
                      : 'border-l-transparent bg-white hover:bg-gray-50/70'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
                      meta.bg,
                      meta.text
                    )}
                  >
                    <Icon size={17} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {n.title}
                      </p>

                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          meta.bg,
                          meta.text
                        )}
                      >
                        {meta.label}
                      </span>

                      {!n.isRead && (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles size={10} />
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {n.message}
                    </p>

                    <p className="text-[10px] text-gray-400 mt-2">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-white border border-blue-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}