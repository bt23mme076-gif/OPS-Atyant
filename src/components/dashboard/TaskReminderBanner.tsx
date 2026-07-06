'use client'

import { CalendarClock } from 'lucide-react'
import Link from 'next/link'

export function TaskReminderBanner() {
  const dueToday = 2
  const dueTomorrow = 1

  return (
    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-red-600 p-3 text-white">
            <CalendarClock size={22} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Task Reminder
            </h2>

            <p className="mt-1 text-sm text-gray-700">
              You have <span className="font-bold">{dueToday}</span> tasks due
              today and <span className="font-bold">{dueTomorrow}</span> due
              tomorrow.
            </p>
          </div>
        </div>

        <Link
          href="/tasks"
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          View Tasks
        </Link>
      </div>
    </div>
  )
}