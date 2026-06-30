"use client"

import { useEffect, useMemo, useState } from "react"
import { SocialIconButton, WhatsAppIcon, Modal } from "@/components/ui"
import { Linkedin, Github, FileText, User, Send, MessageSquare, ThumbsUp, Globe, Plus, Calendar, Clock } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { useGetUploadedPostsQuery, useCreateUploadedPostMutation, useDeleteUploadedPostMutation } from "@/store/api/contentApi"

type ContentStatus = "Idea" | "Draft" | "In Review" | "Approved" | "Published"

export type ActivityType = "draft" | "assign" | "review" | "comment" | "approve" | "publish" | "other"

export type Activity = {
  id: number
  type: ActivityType
  content: string
  timestamp: string // "YYYY-MM-DD"
  performedBy: string
}

type ContentItem = {
  id: number
  title: string
  type: string
  platform: string
  status: ContentStatus
  assignedTo: string
  dueDate: string
  priority: string
  activities?: Activity[]
}

type Intern = {
  username: string
  fullName: string
  email: string
  whatsapp: string
  linkedin: string
  github: string
  avatarColor: string
}

const interns: Record<string, Intern> = {
  "Rohan Mehta": {
    username: "Rohan Mehta",
    fullName: "Rohan Mehta",
    email: "rohan.mehta@atyant.com",
    whatsapp: "+919876543210",
    linkedin: "https://linkedin.com/in/rohanmehta",
    github: "https://github.com/rohanmehta",
    avatarColor: "#7C3AED", // Purple
  },
  "Sneha Sen": {
    username: "Sneha Sen",
    fullName: "Sneha Sen",
    email: "sneha.sen@atyant.com",
    whatsapp: "+919876543211",
    linkedin: "https://linkedin.com/in/snehasen",
    github: "https://github.com/snehasen",
    avatarColor: "#16A34A", // Green
  },
  "Amit Paul": {
    username: "Amit Paul",
    fullName: "Amit Paul",
    email: "amit.paul@atyant.com",
    whatsapp: "+919876543212",
    linkedin: "https://linkedin.com/in/amitpaul",
    github: "https://github.com/amitpaul",
    avatarColor: "#2563EB", // Blue
  },
}

const getInternInfo = (nameStr: string): Intern => {
  if (interns[nameStr]) return interns[nameStr]
  return {
    username: nameStr,
    fullName: nameStr,
    email: "not.assigned@atyant.com",
    whatsapp: "+910000000000",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
    avatarColor: "#6B7280", // Gray
  }
}

function InternHoverCard({ intern, tasksCount }: { intern: Intern; tasksCount: number }) {
  const initials = getInitials(intern.fullName)

  return (
    <div className="relative group inline-block">
      <div className="flex items-center gap-2 cursor-pointer select-none">
        {/* Avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95"
          style={{ backgroundColor: intern.avatarColor }}
        >
          {initials}
        </div>
        {/* Name */}
        <span className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
          {intern.fullName}
        </span>
      </div>

      {/* Hover Card */}
      <div className="absolute bottom-full left-0 z-30 mb-2 w-72 origin-bottom-left scale-90 rounded-xl border border-gray-100 bg-white p-4 opacity-0 shadow-2xl pointer-events-none transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: intern.avatarColor }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900 leading-none truncate">{intern.fullName}</h4>
            <span className="text-[10px] text-gray-400 mt-1 block">Content Intern</span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400 font-medium">Email</span>
            <a href={`mailto:${intern.email}`} className="text-blue-600 hover:underline truncate max-w-[170px]">
              {intern.email}
            </a>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400 font-medium">WhatsApp</span>
            <a href={`https://wa.me/${intern.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {intern.whatsapp}
            </a>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400 font-medium">LinkedIn</span>
            <a href={intern.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[170px]">
              View Profile
            </a>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400 font-medium">GitHub</span>
            <a href={intern.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[170px]">
              View Profile
            </a>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5 mt-2.5">
            <span className="font-medium text-gray-500">Assigned Tasks</span>
            <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {tasksCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const initialContent: ContentItem[] = [
  {
    id: 1,
    title: "Placement roadmap carousel",
    type: "Instagram Carousel",
    platform: "Instagram",
    status: "In Review",
    assignedTo: "Rohan Mehta",
    dueDate: "2026-05-30",
    priority: "High",
    activities: [
      {
        id: 201,
        type: "draft",
        content: "Draft Created",
        timestamp: "2026-06-24",
        performedBy: "Rohan Mehta",
      },
      {
        id: 202,
        type: "assign",
        content: "Assigned to Content Intern",
        timestamp: "2026-06-25",
        performedBy: "System",
      },
      {
        id: 203,
        type: "review",
        content: "Sent for Review",
        timestamp: "2026-06-26",
        performedBy: "Rohan Mehta",
      },
      {
        id: 204,
        type: "comment",
        content: "Review Comments Added",
        timestamp: "2026-06-27",
        performedBy: "Sneha Sen",
      },
      {
        id: 205,
        type: "approve",
        content: "Approved",
        timestamp: "2026-06-29",
        performedBy: "Sneha Sen",
      },
      {
        id: 206,
        type: "publish",
        content: "Published",
        timestamp: "2026-06-30",
        performedBy: "Rohan Mehta",
      },
    ],
  },
  {
    id: 2,
    title: "Senior mentor success story",
    type: "LinkedIn Post",
    platform: "LinkedIn",
    status: "Draft",
    assignedTo: "Sneha Sen",
    dueDate: "2026-05-29",
    priority: "Medium",
    activities: [],
  },
  {
    id: 3,
    title: "Internship preparation blog",
    type: "Blog",
    platform: "Website",
    status: "Approved",
    assignedTo: "Amit Paul",
    dueDate: "2026-06-01",
    priority: "Medium",
    activities: [],
  },
  {
    id: 4,
    title: "WhatsApp offer message",
    type: "Message Copy",
    platform: "WhatsApp",
    status: "Published",
    assignedTo: "Rohan Mehta",
    dueDate: "2026-05-27",
    priority: "Low",
    activities: [],
  },
]

const statusOptions: ContentStatus[] = [
  "Idea",
  "Draft",
  "In Review",
  "Approved",
  "Published",
]

const platformOptions = ["Instagram", "LinkedIn", "Website", "WhatsApp", "YouTube"]

const typeOptions = [
  "Instagram Carousel",
  "Reel Script",
  "LinkedIn Post",
  "Blog",
  "Message Copy",
  "YouTube Script",
]

// Content Timeline display component
function ContentTimeline({ activities }: { activities: Activity[] }) {
  const sortedActivities = useMemo(() => {
    if (!activities) return []
    return [...activities].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [activities])

  if (sortedActivities.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        No workflow history recorded. Log an activity using the form below.
      </div>
    )
  }

  const getIcon = (type: ActivityType) => {
    switch (type) {
      case "draft":
        return <FileText size={12} className="text-white" />
      case "assign":
        return <User size={12} className="text-white" />
      case "review":
        return <Send size={12} className="text-white" />
      case "comment":
        return <MessageSquare size={12} className="text-white" />
      case "approve":
        return <ThumbsUp size={12} className="text-white" />
      case "publish":
        return <Globe size={12} className="text-white" />
      default:
        return <Clock size={12} className="text-white" />
    }
  }

  const getBgColor = (type: ActivityType) => {
    switch (type) {
      case "draft":
        return "bg-purple-500 ring-purple-100"
      case "assign":
        return "bg-blue-500 ring-blue-100"
      case "review":
        return "bg-orange-500 ring-orange-100"
      case "comment":
        return "bg-pink-500 ring-pink-100"
      case "approve":
        return "bg-green-500 ring-green-100"
      case "publish":
        return "bg-emerald-500 ring-emerald-100"
      default:
        return "bg-gray-500 ring-gray-100"
    }
  }

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="relative pl-6 border-l border-gray-200 ml-3 space-y-6">
      {sortedActivities.map((act) => (
        <div key={act.id} className="relative">
          {/* Node dot */}
          <div className={`absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ${getBgColor(act.type)}`}>
            {getIcon(act.type)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {formatDateLabel(act.timestamp)}
            </div>
            <div className="mt-1 flex items-start justify-between gap-4">
              <div className="text-sm font-medium text-gray-800">
                {act.content}
              </div>
              <div className="text-[10px] text-gray-400 bg-gray-50 border px-2 py-0.5 rounded-md flex-shrink-0">
                By: {act.performedBy}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Form to add content activities
function AddContentActivityForm({ onAdd }: { onAdd: (type: ActivityType, content: string, performedBy: string, dateStr: string) => void }) {
  const [type, setType] = useState<ActivityType>("draft")
  const [content, setContent] = useState("")
  const [performedBy, setPerformedBy] = useState("")
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split("T")[0])

  // Automatically update content draft/review titles depending on select
  const handleTypeChange = (newType: ActivityType) => {
    setType(newType)
    switch (newType) {
      case "draft":
        setContent("Draft Created")
        break
      case "assign":
        setContent("Assigned to Content Intern")
        break
      case "review":
        setContent("Sent for Review")
        break
      case "comment":
        setContent("Review Comments Added")
        break
      case "approve":
        setContent("Approved")
        break
      case "publish":
        setContent("Published")
        break
      default:
        setContent("")
    }
  }

  // Set initial content on mount
  useEffect(() => {
    setContent("Draft Created")
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onAdd(type, content, performedBy, dateStr)
    setPerformedBy("")
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Log Workflow Event</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-400 font-medium mb-1">Event Type</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as ActivityType)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
          >
            <option value="draft">📝 Draft Created</option>
            <option value="assign">👤 Assigned to Intern</option>
            <option value="review">📤 Sent for Review</option>
            <option value="comment">💬 Review Comments Added</option>
            <option value="approve">👍 Approved</option>
            <option value="publish">🌐 Published</option>
            <option value="other">⚙️ Custom / System Log</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] text-gray-400 font-medium mb-1">Date</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
          />
        </div>

        <div className="flex flex-col sm:col-span-2">
          <label className="text-[10px] text-gray-400 font-medium mb-1">Performed By</label>
          <input
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
            placeholder="e.g. Rohan Mehta, Sneha Sen"
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col sm:col-span-2">
          <label className="text-[10px] text-gray-400 font-medium mb-1">Activity Content</label>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g., Draft Completed, Approved by lead..."
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
      >
        <Plus size={12} /> Log Event
      </button>
    </form>
  )
}

export default function ContentPage() {
  const currentUser = { name: "Content Team" }
  const { data: uploadedPosts = [] } = useGetUploadedPostsQuery()
  const [createUploadedPost, { isLoading: isUploading }] = useCreateUploadedPostMutation()
  const [deleteUploadedPost] = useDeleteUploadedPostMutation()
  const [showUploadedModal, setShowUploadedModal] = useState(false)
  const [uploadedForm, setUploadedForm] = useState({
    platform: "Instagram" as "Instagram" | "LinkedIn",
    postUrl: ""
  })

  const [contentItems, setContentItems] = useState<ContentItem[]>(initialContent)
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [platformFilter, setPlatformFilter] = useState("All")
  const [showForm, setShowForm] = useState(false)

  const handleRowClick = (e: React.MouseEvent, item: ContentItem) => {
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest("select") || target.closest("a") || target.closest(".group")) {
      return
    }
    setSelectedItem(item)
  }

  const handleLogActivity = (type: ActivityType, content: string, performedBy: string, dateStr: string) => {
    if (!selectedItem) return
    const itemId = selectedItem.id
    const newActivity: Activity = {
      id: Date.now(),
      type,
      content,
      timestamp: dateStr || new Date().toISOString().split("T")[0],
      performedBy: performedBy || selectedItem.assignedTo || "System",
    }

    setContentItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const updatedActivities = [...(item.activities || []), newActivity]
          // Update selectedItem modal details state
          setSelectedItem((curr) => curr ? { ...curr, activities: updatedActivities } : null)
          return { ...item, activities: updatedActivities }
        }
        return item
      })
    )
  }

  const [form, setForm] = useState({
    title: "",
    type: "Instagram Carousel",
    platform: "Instagram",
    status: "Idea" as ContentStatus,
    assignedTo: "",
    dueDate: "",
    priority: "Medium",
  })

  const filteredContent = useMemo(() => {
    return contentItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase()) ||
        item.platform.toLowerCase().includes(search.toLowerCase()) ||
        item.assignedTo.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter

      const matchesPlatform =
        platformFilter === "All" || item.platform === platformFilter

      return matchesSearch && matchesStatus && matchesPlatform
    })
  }, [contentItems, search, statusFilter, platformFilter])

  const stats = {
    total: contentItems.length,
    drafts: contentItems.filter((item) => item.status === "Draft").length,
    inReview: contentItems.filter((item) => item.status === "In Review").length,
    approved: contentItems.filter((item) => item.status === "Approved").length,
    published: contentItems.filter((item) => item.status === "Published").length,
  }

  const addContent = () => {
    if (!form.title.trim()) return

    const newContent: ContentItem = {
      id: Date.now(),
      title: form.title,
      type: form.type,
      platform: form.platform,
      status: form.status,
      assignedTo: form.assignedTo || "Not assigned",
      dueDate: form.dueDate || "Not set",
      priority: form.priority,
    }

    setContentItems([newContent, ...contentItems])

    setForm({
      title: "",
      type: "Instagram Carousel",
      platform: "Instagram",
      status: "Idea",
      assignedTo: "",
      dueDate: "",
      priority: "Medium",
    })

    setShowForm(false)
  }

  const updateStatus = (id: number, status: ContentStatus) => {
    setContentItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    )
  }

  const deleteContent = (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this content item?"
    )

    if (!confirmDelete) return

    setContentItems((prev) => prev.filter((item) => item.id !== id))
  }

  const getStatusStyle = (status: ContentStatus) => {
    if (status === "Published") return "bg-green-50 text-green-700"
    if (status === "Approved") return "bg-blue-50 text-blue-700"
    if (status === "In Review") return "bg-orange-50 text-orange-700"
    if (status === "Draft") return "bg-purple-50 text-purple-700"
    return "bg-gray-100 text-gray-700"
  }

  const getPriorityStyle = (priority: string) => {
    if (priority === "High") return "bg-red-50 text-red-700"
    if (priority === "Medium") return "bg-yellow-50 text-yellow-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage content ideas, drafts, reviews, and publishing status.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowUploadedModal(true)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            Add Uploaded Post
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            Add Content
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Total Content
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {stats.total}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Drafts
          </p>
          <h2 className="mt-2 text-3xl font-bold text-purple-600">
            {stats.drafts}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            In Review
          </p>
          <h2 className="mt-2 text-3xl font-bold text-orange-600">
            {stats.inReview}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Approved
          </p>
          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {stats.approved}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Published
          </p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {stats.published}
          </h2>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, type, platform, or assignee"
            className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All Platforms</option>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Content Item
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Content title"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            >
              {platformOptions.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>

            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ContentStatus })
              }
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <input
              value={form.assignedTo}
              onChange={(e) =>
                setForm({ ...form, assignedTo: e.target.value })
              }
              placeholder="Assigned to"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={addContent}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Content
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Content Tracker
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track content work, assigned interns, due dates, and publishing
            progress.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Platform</th>
                <th className="px-5 py-3">Assigned To</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredContent.map((item) => (
                <tr key={item.id} onClick={(e) => handleRowClick(e, item)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {item.title}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{item.type}</td>
                  <td className="px-5 py-4 text-gray-600">{item.platform}</td>
                  <td className="px-5 py-4">
                    {(() => {
                      const intern = getInternInfo(item.assignedTo)
                      const tasksCount = contentItems.filter((ci) => ci.assignedTo === item.assignedTo).length
                      return (
                        <InternHoverCard intern={intern} tasksCount={tasksCount} />
                      )
                    })()}
                  </td>
                  <td className="px-5 py-4">
                    {(() => {
                      const intern = getInternInfo(item.assignedTo)
                      const cleanWhatsapp = intern.whatsapp.replace(/\D/g, "")
                      return (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <SocialIconButton
                            icon={<WhatsAppIcon size={12} />}
                            href={`https://wa.me/${cleanWhatsapp}`}
                            tooltip={`WhatsApp: ${intern.whatsapp}`}
                            colorClass="text-green-600 hover:bg-green-50 border-green-200"
                          />
                          <SocialIconButton
                            icon={<Linkedin size={12} />}
                            href={intern.linkedin}
                            tooltip="LinkedIn Profile"
                            colorClass="text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                          />
                          <SocialIconButton
                            icon={<Github size={12} />}
                            href={intern.github}
                            tooltip="GitHub Profile"
                            colorClass="text-gray-800 hover:bg-gray-100 border-gray-300"
                          />
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{item.dueDate}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateStatus(item.id, e.target.value as ContentStatus)
                      }
                      className={`rounded-full px-3 py-1 text-xs font-semibold outline-none ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => deleteContent(item.id)}
                      className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContent.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            No content items found.
          </div>
        )}
      </div>

      {/* Uploaded Posts Section */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm mt-6">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Uploaded Posts
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Instagram and LinkedIn post URLs added by the content team.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Platform</th>
                <th className="px-5 py-3">Post URL</th>
                <th className="px-5 py-3">Uploaded By</th>
                <th className="px-5 py-3">Created At</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {uploadedPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {post.platform === "LinkedIn" ? (
                      <span className="inline-flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        LinkedIn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-pink-600 bg-pink-50 px-2.5 py-1 rounded-md text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-600" />
                        Instagram
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-blue-600 font-medium">
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline break-all"
                    >
                      {post.postUrl}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{post.uploadedBy}</td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this uploaded post?")) {
                          try {
                            await deleteUploadedPost(post.id).unwrap()
                          } catch (err) {
                            console.error("Failed to delete post:", err)
                          }
                        }
                      }}
                      className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {uploadedPosts.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            No uploaded posts added yet.
          </div>
        )}
      </div>

      {/* Add Uploaded Post Modal */}
      <Modal
        open={showUploadedModal}
        onClose={() => setShowUploadedModal(false)}
        title={
          <span className="text-lg font-bold text-gray-900">
            Add Uploaded Post
          </span>
        }
        size="md"
      >
        <div className="space-y-4 pt-2">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 mb-1">
              Platform
            </label>
            <select
              value={uploadedForm.platform}
              onChange={(e) =>
                setUploadedForm({
                  ...uploadedForm,
                  platform: e.target.value as "Instagram" | "LinkedIn"
                })
              }
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 bg-white"
            >
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 mb-1">
              Post URL
            </label>
            <input
              value={uploadedForm.postUrl}
              onChange={(e) =>
                setUploadedForm({ ...uploadedForm, postUrl: e.target.value })
              }
              placeholder="https://..."
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={async () => {
                if (!uploadedForm.postUrl.trim()) return
                try {
                  await createUploadedPost({
                    platform: uploadedForm.platform,
                    postUrl: uploadedForm.postUrl,
                  }).unwrap()
                  setUploadedForm({ platform: "Instagram", postUrl: "" })
                  setShowUploadedModal(false)
                } catch (err) {
                  console.error("Failed to save post:", err)
                }
              }}
              disabled={isUploading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {isUploading ? "Saving..." : "Save Post"}
            </button>
            <button
              onClick={() => setShowUploadedModal(false)}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Activity Timeline Modal */}
      {selectedItem && (
        <Modal
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={
            <span className="text-lg font-bold text-gray-900">
              Content Details: {selectedItem.title}
            </span>
          }
          size="md"
        >
          <div className="space-y-6">
            {/* Quick Summary Card */}
            <div className="bg-gray-50 rounded-xl p-4 border text-xs text-gray-600 grid gap-2 sm:grid-cols-2">
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider">Type</span>
                <span className="text-gray-800 font-medium text-sm">{selectedItem.type}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider">Platform</span>
                <span className="text-gray-800 font-medium text-sm">{selectedItem.platform}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider">Assigned Intern</span>
                <span className="text-gray-800 font-medium text-sm">{selectedItem.assignedTo}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider">Due Date</span>
                <span className="text-gray-800 font-medium text-sm">{selectedItem.dueDate}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider font-semibold">Priority</span>
                <span className={`inline-block rounded-full px-2 py-0.5 mt-0.5 text-[10px] font-semibold ${getPriorityStyle(selectedItem.priority)}`}>
                  {selectedItem.priority}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider font-semibold">Status</span>
                <span className={`inline-block rounded-full px-2 py-0.5 mt-0.5 text-[10px] font-semibold ${getStatusStyle(selectedItem.status)}`}>
                  {selectedItem.status}
                </span>
              </div>
            </div>

            {/* Workflow Timeline */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wider">Workflow History</h3>
              <ContentTimeline activities={selectedItem.activities || []} />
            </div>

            {/* Add Workflow Event Form */}
            <AddContentActivityForm onAdd={handleLogActivity} />
          </div>
        </Modal>
      )}
    </div>
  )
}
