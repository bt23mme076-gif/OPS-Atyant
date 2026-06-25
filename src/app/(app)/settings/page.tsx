'use client'
import { useState, useEffect, useRef } from 'react'
import { useCurrentUser, useAppDispatch } from '@/store/hooks'
import { Avatar, Button } from '@/components/ui'
import { useUpdateUserMutation } from '@/store/api/usersApi'
import { updateCurrentUser } from '@/store/slices/authSlice'
import { Copy, Edit3, Phone, Linkedin, ExternalLink, Camera, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const user        = useCurrentUser()
  const dispatch    = useAppDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [repoLink,        setRepoLink]        = useState('')
  const [whatsappNumber,  setWhatsappNumber]  = useState('')
  const [linkedinUrl,     setLinkedinUrl]     = useState('')
  const [isEditing,       setIsEditing]       = useState(false)
  const [isUploading,     setIsUploading]     = useState(false)
  // Local preview URL — shown immediately after pick, before server round-trip
  const [previewImage,    setPreviewImage]    = useState<string | null>(null)

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  useEffect(() => {
    setRepoLink(user?.repoLink         || '')
    setWhatsappNumber(user?.whatsappNumber || '')
    setLinkedinUrl(user?.linkedinUrl     || '')
  }, [user])

  // ── Validation ───────────────────────────────────────────────────────────
  const GITHUB_USERNAME_REGEX =
    /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/
  const WHATSAPP_REGEX = /^\+?[1-9]\d{6,14}$/
  const LINKEDIN_REGEX =
    /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[a-zA-Z0-9_%-]+(\/)?$/

  // ── Save contact info ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return
    const trimmedRepo = repoLink.trim()
    const trimmedWA   = whatsappNumber.trim()
    const trimmedLI   = linkedinUrl.trim()

    if (trimmedRepo && !GITHUB_USERNAME_REGEX.test(trimmedRepo)) {
      toast.error('Invalid GitHub username.')
      return
    }
    if (trimmedWA && !WHATSAPP_REGEX.test(trimmedWA)) {
      toast.error('Invalid WhatsApp number. Use international format e.g. +919876543210')
      return
    }
    if (trimmedLI && !LINKEDIN_REGEX.test(trimmedLI)) {
      toast.error('Invalid LinkedIn URL.')
      return
    }

    try {
      await updateUser({
        id:   user.id,
        data: {
          repoLink:       trimmedRepo || null,
          whatsappNumber: trimmedWA   || null,
          linkedinUrl:    trimmedLI   || null,
        },
      }).unwrap()

      dispatch(updateCurrentUser({
        repoLink:       trimmedRepo || null,
        whatsappNumber: trimmedWA   || null,
        linkedinUrl:    trimmedLI   || null,
      }))

      toast.success('Profile saved!')
      setIsEditing(false)
    } catch {
      toast.error('Failed to save profile')
    }
  }

  // ── Copy GitHub username ─────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!user?.repoLink) return
    try {
      await navigator.clipboard.writeText(user.repoLink)
      toast.success('GitHub username copied!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  // ── Profile image upload ─────────────────────────────────────────────────
  const handleProfileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // ── Client-side guards ──────────────────────────────────────
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF images are allowed')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB')
      return
    }

    // ── Show instant local preview ──────────────────────────────
    const localUrl = URL.createObjectURL(file)
    setPreviewImage(localUrl)

    // ── Upload to server ────────────────────────────────────────
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body:   formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Upload failed')
      }

      const { url }: { url: string } = await res.json()

      // ── Persist to backend via existing mutation ────────────
      await updateUser({
        id:   user.id,
        data: { profileImage: url },
      }).unwrap()

      // ── Update Redux + localStorage ─────────────────────────
      dispatch(updateCurrentUser({ profileImage: url }))

      // Replace local blob URL with real server URL
      setPreviewImage(url)
      toast.success('Profile photo updated!')
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
      // Roll back preview on error
      setPreviewImage(null)
    } finally {
      setIsUploading(false)
      // Reset input so the same file can be picked again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Derived avatar image: local preview → saved image → nothing ──────────
  const avatarImage = previewImage ?? user?.profileImage ?? undefined

  // ─────────────────────────────────────────────────────────────────────────
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

            {/* ── Avatar with upload button ── */}
            <div className="relative flex-shrink-0">
              <Avatar
                name={user.name}
                image={avatarImage}
                size={56}
                ring
                ringColor={avatarImage ? '#2563EB' : '#E5E7EB'}
              />

              {/* Camera overlay — shown while NOT uploading */}
              {!isUploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile photo"
                  className="
                    absolute -bottom-1 -right-1
                    flex items-center justify-center
                    w-6 h-6 rounded-full
                    bg-blue-600 hover:bg-blue-700
                    text-white shadow-md
                    transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                  "
                >
                  <Camera size={12} />
                </button>
              )}

              {/* Spinner overlay — shown while uploading */}
              {isUploading && (
                <div className="
                  absolute -bottom-1 -right-1
                  flex items-center justify-center
                  w-6 h-6 rounded-full
                  bg-blue-100 shadow-md
                ">
                  <Loader2 size={12} className="animate-spin text-blue-600" />
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                id="profile-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={handleProfileUpload}
              />
            </div>

            {/* ── Name / email / role ── */}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <span className="text-xs text-blue-600 font-medium capitalize">
                {user.role.replace('_', ' ')}
              </span>

              {/* Upload hint */}
              <p className="text-[10px] text-gray-400 mt-0.5">
                {isUploading
                  ? 'Uploading…'
                  : 'Click the camera icon to change photo'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Loading...</p>
        )}

        {/* ── Contact & Integration (INTERNs only) ── */}
        {user?.role === 'INTERN' && (
          <div className="border-t border-gray-100 pt-5 mt-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900">Contact & Integration</h3>

            {isEditing ? (
              <div className="space-y-4">
                {/* WhatsApp */}
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
                  <p className="text-[11px] text-gray-400 mt-1">
                    International format e.g. +919876543210
                  </p>
                </div>

                {/* LinkedIn */}
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

                {/* GitHub */}
                <div>
                  <label htmlFor="github-username" className="block text-xs font-medium text-gray-500 mb-1">
                    GitHub Username
                  </label>
                  <input
                    id="github-username"
                    type="text"
                    className="input w-full"
                    placeholder="e.g. johndoe"
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
                      setRepoLink(user.repoLink         || '')
                      setWhatsappNumber(user.whatsappNumber || '')
                      setLinkedinUrl(user.linkedinUrl     || '')
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
                          <span className="truncate">
                            {user.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '')}
                          </span>
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
                      <p className="text-[10px] text-gray-400 font-medium">GitHub Username</p>
                      {user.repoLink ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://github.com/${user.repoLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline truncate block max-w-[200px]"
                          >
                            @{user.repoLink}
                          </a>
                          <button
                            onClick={handleCopy}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Copy username"
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
          <p className="text-xs text-gray-400">
            To change your password or profile details, contact your admin.
          </p>
        </div>
      </div>
    </div>
  )
}
