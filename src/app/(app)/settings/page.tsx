'use client'
import { useState, useEffect } from 'react'
import { useCurrentUser, useAppDispatch } from '@/store/hooks'
import { Avatar, Button } from '@/components/ui'
import { getInitials } from '@/lib/utils'
import { useUpdateUserMutation } from '@/store/api/usersApi'
import { updateCurrentUser } from '@/store/slices/authSlice'
import { Copy, Edit3, Phone, Linkedin, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const user = useCurrentUser()
  const dispatch = useAppDispatch()
  const [repoLink, setRepoLink] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  useEffect(() => {
    setRepoLink(user?.repoLink || '')
    setWhatsappNumber(user?.whatsappNumber || '')
    setLinkedinUrl(user?.linkedinUrl || '')
  }, [user])

  const GITHUB_REPO_REGEX = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/
  const WHATSAPP_REGEX = /^\+?[1-9]\d{6,14}$/
  const LINKEDIN_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[a-zA-Z0-9_%-]+(\/)?$/

  const handleSave = async () => {
    if (!user) return
    const trimmedRepo = repoLink.trim()
    const trimmedWA = whatsappNumber.trim()
    const trimmedLI = linkedinUrl.trim()

    if (trimmedRepo && !GITHUB_REPO_REGEX.test(trimmedRepo)) {
      toast.error('Invalid GitHub Repository URL. Use format: https://github.com/username/repo')
      return
    }
    if (trimmedWA && !WHATSAPP_REGEX.test(trimmedWA)) {
      toast.error('Invalid WhatsApp number. Use international format, e.g. +919876543210')
      return
    }
    if (trimmedLI && !LINKEDIN_REGEX.test(trimmedLI)) {
      toast.error('Invalid LinkedIn URL. Use format: https://linkedin.com/in/yourname')
      return
    }

    try {
      await updateUser({
        id: user.id,
        data: {
          repoLink: trimmedRepo || null,
          whatsappNumber: trimmedWA || null,
          linkedinUrl: trimmedLI || null,
        }
      }).unwrap()
      dispatch(updateCurrentUser({
        repoLink: trimmedRepo || null,
        whatsappNumber: trimmedWA || null,
        linkedinUrl: trimmedLI || null,
      }))
      toast.success('Profile saved successfully!')
      setIsEditing(false)
    } catch {
      toast.error('Failed to save profile')
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

        {/* Contact & Integration fields for interns */}
        {user?.role === 'INTERN' && (
          <div className="border-t border-gray-100 pt-5 mt-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900">Contact & Integration</h3>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="whatsapp" className="block text-xs font-medium text-gray-500 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    className="input w-full"
                    placeholder="+919876543210"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    disabled={isUpdating}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">International format, e.g. +919876543210</p>
                </div>
                <div>
                  <label htmlFor="linkedin" className="block text-xs font-medium text-gray-500 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    id="linkedin"
                    type="url"
                    className="input w-full"
                    placeholder="https://linkedin.com/in/yourname"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
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
                      setWhatsappNumber(user.whatsappNumber || '')
                      setLinkedinUrl(user.linkedinUrl || '')
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
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* WhatsApp */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">WhatsApp</p>
                      {user.whatsappNumber ? (
                        <a
                          href={`https://wa.me/${user.whatsappNumber.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-green-600 hover:underline"
                        >
                          {user.whatsappNumber}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Not added</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Linkedin size={14} className="text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-medium">LinkedIn</p>
                      {user.linkedinUrl ? (
                        <a
                          href={user.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{user.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '')}</span>
                          <ExternalLink size={11} className="flex-shrink-0" />
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Not added</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* GitHub */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Edit3 size={14} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-medium">GitHub Repository</p>
                      {user.repoLink ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={user.repoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline truncate block max-w-[200px]"
                          >
                            {user.repoLink}
                          </a>
                          <button
                            onClick={handleCopy}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Copy URL"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Not added</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                  >
                    <Edit3 size={12} /> Edit Contact Info
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
