"use client"

import { useMemo, useState } from "react"

type ContentStatus = "Idea" | "Draft" | "In Review" | "Approved" | "Published"

type ContentItem = {
  id: number
  title: string
  type: string
  platform: string
  status: ContentStatus
  assignedTo: string
  dueDate: string
  priority: string
}

const initialContent: ContentItem[] = [
  {
    id: 1,
    title: "Placement roadmap carousel",
    type: "Instagram Carousel",
    platform: "Instagram",
    status: "In Review",
    assignedTo: "Content Intern",
    dueDate: "2026-05-30",
    priority: "High",
  },
  {
    id: 2,
    title: "Senior mentor success story",
    type: "LinkedIn Post",
    platform: "LinkedIn",
    status: "Draft",
    assignedTo: "Content Intern",
    dueDate: "2026-05-29",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Internship preparation blog",
    type: "Blog",
    platform: "Website",
    status: "Approved",
    assignedTo: "Content Intern",
    dueDate: "2026-06-01",
    priority: "Medium",
  },
  {
    id: 4,
    title: "WhatsApp offer message",
    type: "Message Copy",
    platform: "WhatsApp",
    status: "Published",
    assignedTo: "Content Intern",
    dueDate: "2026-05-27",
    priority: "Low",
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

export default function ContentPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>(initialContent)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [platformFilter, setPlatformFilter] = useState("All")
  const [showForm, setShowForm] = useState(false)

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

        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Content
        </button>
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
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {item.title}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{item.type}</td>
                  <td className="px-5 py-4 text-gray-600">{item.platform}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {item.assignedTo}
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
    </div>
  )
}