'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Plus, Trash2, Pencil } from 'lucide-react'
import { useCurrentUser } from '@/store/hooks'

type AnnouncementType = 'GENERAL' | 'MEETING' | 'DEADLINE' | 'URGENT'

type Announcement = {
  id: string
  title: string
  message: string
  type: AnnouncementType
}

const typeStyles: Record<AnnouncementType, string> = {
  GENERAL: 'bg-blue-50 text-blue-700 border-blue-200',
  MEETING: 'bg-purple-50 text-purple-700 border-purple-200',
  DEADLINE: 'bg-amber-50 text-amber-700 border-amber-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200',
}

export default function AnnouncementsPage() {
  const user = useCurrentUser()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  useEffect(() => {
  const saved = localStorage.getItem('announcements')

  if (saved) {
    setAnnouncements(JSON.parse(saved))
  }
}, [])

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<AnnouncementType>('GENERAL')
  const [error, setError] = useState('')

  const canManage = user?.role === 'SUPER_ADMIN'

    function handlePost() {
  if (!title.trim() || !message.trim() || !type.trim()) {
    setError('Please fill all fields before posting the announcement.')
    return
  }

  const newAnnouncement = {
    id: Date.now().toString(),
    title,
    message,
    type,
  }

  const updatedAnnouncements = [newAnnouncement, ...announcements]

  setAnnouncements(updatedAnnouncements)
  localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements))

  setTitle('')
  setMessage('')
  setType('GENERAL')
  setError('')
}

    function handleDelete(id: string) {
    const updatedAnnouncements = announcements.filter((item) => item.id !== id)

    setAnnouncements(updatedAnnouncements)
    localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements))
  }

  if (!canManage) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
        <p className="mt-2 text-sm text-gray-500">
          Only Super Admin can create announcements.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500">
          Create important updates for interns and managers.
        </p>
      </div>

      <div className="card mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3 text-white">
            <Megaphone size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Create Announcement
            </h2>
            <p className="text-sm text-gray-500">
              This will appear on every dashboard.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write announcement details..."
            rows={4}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value as AnnouncementType)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="GENERAL">General</option>
            <option value="MEETING">Meeting</option>
            <option value="DEADLINE">Deadline</option>
            <option value="URGENT">Urgent</option>
          </select>
          {error && (
  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
    {error}
  </p>
)}

          <button
            onClick={handlePost}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Plus size={16} />
            Post Announcement
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {announcements.map((item) => (
          <div key={item.id} className="card p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles[item.type]}`}
              >
                {item.type}
              </span>

              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-gray-900">{item.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}