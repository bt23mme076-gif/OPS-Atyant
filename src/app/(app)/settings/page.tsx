'use client'
import { useCurrentUser } from '@/store/hooks'
import { Avatar } from '@/components/ui'
import { getInitials } from '@/lib/utils'

export default function SettingsPage() {
  const user = useCurrentUser()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your account and preferences</p>
      </div>

      <div className="card p-6 max-w-lg">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Profile</h2>
        {user ? (
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
              {getInitials(user.name)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="text-xs text-blue-600 font-medium capitalize">{user.role.replace('_', ' ')}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Loading...</p>
        )}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400">To change your password or profile details, contact your admin.</p>
        </div>
      </div>
    </div>
  )
}
