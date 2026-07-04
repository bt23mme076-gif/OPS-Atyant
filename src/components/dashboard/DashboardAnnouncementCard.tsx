'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useCurrentUser } from '@/store/hooks'

type AnnouncementType = 'GENERAL' | 'MEETING' | 'DEADLINE' | 'URGENT'

type Announcement = {
  id: string
  title: string
  message: string
  type: AnnouncementType
}

const fallbackAnnouncement: Announcement = {
  id: '1',
  title: 'Weekly Sprint Update',
  message: 'Please complete your pending tasks before the next review meeting.',
  type: 'DEADLINE',
}

const styles: Record<AnnouncementType, string> = {
  GENERAL: 'bg-blue-50 text-blue-700 border-blue-200',
  MEETING: 'bg-purple-50 text-purple-700 border-purple-200',
  DEADLINE: 'bg-amber-50 text-amber-700 border-amber-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200',
}

export function DashboardAnnouncementCard() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const user = useCurrentUser()

  useEffect(() => {
    const saved = localStorage.getItem('announcements')

    if (saved) {
      const parsed = JSON.parse(saved) as Announcement[]
      setAnnouncement(parsed[0] ?? null)
    } else {
      setAnnouncement(null)
    }
  }, [])

  if (!announcement) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
      <span>📢 No announcements available.</span>

      {user?.role === 'SUPER_ADMIN' && (
        <Link
          href="/announcements"
          className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition"
        >
          + New Announcement
        </Link>
      )}
    </div>
  )
}

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        

        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
  <span className="text-xl">📢</span>

  <span
    className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[announcement.type]}`}
  >
    {announcement.type}
  </span>
</div>
          

          <h2 className="text-lg font-bold text-gray-900">
            {announcement.title}
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            {announcement.message}
          </p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
  <Link
    href="/announcements"
    className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition"
    title="Create Announcement"
  >
  + New
</Link>
)}
      </div>
    </div>
  )
}