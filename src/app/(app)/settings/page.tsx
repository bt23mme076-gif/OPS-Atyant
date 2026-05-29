'use client'
import { useState, useEffect } from 'react'
import { useCurrentUser, useAppDispatch } from '@/store/hooks'
import { Avatar, Button } from '@/components/ui'
import { getInitials } from '@/lib/utils'
import { useUpdateUserMutation } from '@/store/api/usersApi'
import { updateCurrentUser } from '@/store/slices/authSlice'
import { Copy, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const user = useCurrentUser()
  const dispatch = useAppDispatch()
  const [repoLink, setRepoLink] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  useEffect(() => {
    if (user?.repoLink) {
      setRepoLink(user.repoLink)
    } else {
      setRepoLink('')
    }
  }, [user])

  const GITHUB_REPO_REGEX = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/

  const handleSave = async () => {
    if (!user) return
    const trimmedLink = repoLink.trim()

    if (trimmedLink && !GITHUB_REPO_REGEX.test(trimmedLink)) {
      toast.error('Invalid GitHub Repository URL. Use format: https://github.com/username/repo')
      return
    }

    try {
      await updateUser({
        id: user.id,
        data: { repoLink: trimmedLink || null }
      }).unwrap()
      dispatch(updateCurrentUser({ repoLink: trimmedLink || null }))
      toast.success('Repo link saved successfully!')
      setIsEditing(false)
    } catch {
      toast.error('Failed to save repo link')
    }
  }

  const handleCopy = async () => {
    const link = user?.repoLink
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Repo link copied to clipboard!')
    } catch {
      toast.error('Failed to copy repo link')
    }
  }

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

        {/* GitHub Repo field for interns */}
        {user?.role === 'INTERN' && (
          <div className="border-t border-gray-100 pt-5 mt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">GitHub Integration</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="github-repo" className="block text-xs font-medium text-gray-500 mb-1">
                    GitHub Repo URL
                  </label>
                  <input
                    id="github-repo"
                    type="text"
                    className="input w-full"
                    placeholder="https://github.com/username/repository"
                    value={repoLink}
                    onChange={(e) => setRepoLink(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setRepoLink(user.repoLink || '')
                      setIsEditing(false)
                    }}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    loading={isUpdating}
                  >
                    Save Link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center justify-between">
                <div className="truncate pr-4">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">GitHub Repository</p>
                  {user.repoLink ? (
                    <a
                      href={user.repoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline truncate block"
                    >
                      {user.repoLink}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No repo added</p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {user.repoLink && (
                    <button
                      onClick={handleCopy}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                      title="Copy URL"
                      aria-label="Copy Repo Link"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                    aria-label="Edit Repo Link"
                  >
                    <Edit3 size={12} />
                    {user.repoLink ? 'Edit' : 'Add Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 mt-5">
          <p className="text-xs text-gray-400">To change your password or profile details, contact your admin.</p>
        </div>
      </div>
    </div>
  )
}
