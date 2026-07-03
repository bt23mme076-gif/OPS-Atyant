"use client"

import { useEffect, useMemo, useState } from "react"
import { getFollowUpStatus } from "@/lib/utils"
import { SocialIconButton, WhatsAppIcon, Modal } from "@/components/ui"
import { Mail, Linkedin, Phone, MessageCircle, PhoneCall, FileText, Calendar, User, Plus, Check } from "lucide-react"

type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Follow-up Pending"
  | "Converted"

export type ActivityType = "note" | "call" | "whatsapp" | "reminder" | "system"

export type Activity = {
  id: number
  type: ActivityType
  content: string
  timestamp: string // "YYYY-MM-DD" or similar format
  performedBy: string
}

type Lead = {
  id: number
  name: string
  college: string
  source: string
  status: LeadStatus
  assignedTo: string
  followUpDate: string
  notes: string
  phone?: string
  email?: string
  linkedIn?: string
  activities?: Activity[]
}

function FollowUpStatusBadge({ dateStr, today }: { dateStr: string; today: Date }) {
  const status = getFollowUpStatus(dateStr, today)

  if (status.type === 'none') {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.pillClass}`}>
        {status.text}
      </span>
    )
  }

  return (
    <div className="relative group inline-block">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold cursor-pointer shadow-sm ${status.pillClass}`}>
        {status.text}
      </span>
      
      {/* Premium Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 scale-75 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-xl pointer-events-none transition-all duration-200 ease-out origin-bottom group-hover:scale-100 group-hover:opacity-100">
        {status.tooltipText}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  )
}

const initialLeads: Lead[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    college: "Malla Reddy University",
    source: "Instagram",
    status: "Interested",
    assignedTo: "Outreach Intern",
    followUpDate: "2026-06-16",
    notes: "Interested in placement roadmap",
    phone: "+919876543210",
    email: "aarav.sharma@example.com",
    linkedIn: "https://linkedin.com/in/aaravsharma",
    activities: [
      {
        id: 101,
        type: "whatsapp",
        content: "WhatsApp Message Sent",
        timestamp: "2026-06-24",
        performedBy: "Outreach Intern"
      },
      {
        id: 102,
        type: "call",
        content: "Phone Call Completed",
        timestamp: "2026-06-26",
        performedBy: "Outreach Intern"
      },
      {
        id: 103,
        type: "note",
        content: "Student asked about placement roadmap",
        timestamp: "2026-06-27",
        performedBy: "Outreach Intern"
      },
      {
        id: 104,
        type: "reminder",
        content: "Follow-up scheduled",
        timestamp: "2026-06-30",
        performedBy: "Outreach Intern"
      }
    ]
  },
  {
    id: 2,
    name: "Sneha Reddy",
    college: "CMR Engineering College",
    source: "WhatsApp",
    status: "Contacted",
    assignedTo: "Outreach Intern",
    followUpDate: "2026-06-17",
    notes: "Asked for senior mentor details",
    phone: "+918765432109",
    email: "sneha.reddy@example.com",
    linkedIn: "https://linkedin.com/in/snehareddy",
    activities: []
  },
  {
    id: 3,
    name: "Rahul Verma",
    college: "VNR VJIET",
    source: "Referral",
    status: "Follow-up Pending",
    assignedTo: "Outreach Intern",
    followUpDate: "2026-06-19",
    notes: "Needs reminder message",
    phone: "+917654321098",
    email: "rahul.verma@example.com",
    linkedIn: "https://linkedin.com/in/rahulverma",
    activities: []
  },
  {
    id: 4,
    name: "Meghana Rao",
    college: "GNITS",
    source: "College Campaign",
    status: "Converted",
    assignedTo: "Outreach Intern",
    followUpDate: "2026-06-15",
    notes: "Joined after demo",
    phone: "+916543210987",
    email: "meghana.rao@example.com",
    linkedIn: "https://linkedin.com/in/meghanarao",
    activities: []
  },
]

const statusOptions: LeadStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Follow-up Pending",
  "Converted",
]

const sourceOptions = ["Instagram", "WhatsApp", "Referral", "College Campaign"]

// Timeline display component
function LeadTimeline({ activities }: { activities: Activity[] }) {
  const sortedActivities = useMemo(() => {
    if (!activities) return []
    return [...activities].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [activities])

  if (sortedActivities.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        No activities recorded yet. Log an activity using the form below.
      </div>
    )
  }

  const getIcon = (type: ActivityType) => {
    switch (type) {
      case "whatsapp":
        return <MessageCircle size={12} className="text-white" />
      case "call":
        return <PhoneCall size={12} className="text-white" />
      case "note":
        return <FileText size={12} className="text-white" />
      case "reminder":
        return <Calendar size={12} className="text-white" />
      default:
        return <User size={12} className="text-white" />
    }
  }

  const getBgColor = (type: ActivityType) => {
    switch (type) {
      case "whatsapp":
        return "bg-green-500 ring-green-100"
      case "call":
        return "bg-blue-500 ring-blue-100"
      case "note":
        return "bg-purple-500 ring-purple-100"
      case "reminder":
        return "bg-orange-500 ring-orange-100"
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
                ✓ {act.content}
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

// Form to add activities
function AddActivityForm({ onAdd }: { onAdd: (type: ActivityType, content: string, performedBy: string, dateStr: string) => void }) {
  const [type, setType] = useState<ActivityType>("note")
  const [content, setContent] = useState("")
  const [performedBy, setPerformedBy] = useState("")
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split("T")[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onAdd(type, content, performedBy, dateStr)
    setContent("")
    setPerformedBy("")
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Log New Activity</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-400 font-medium mb-1">Activity Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
          >
            <option value="note">📝 Note</option>
            <option value="call">📞 Call Log</option>
            <option value="whatsapp">💬 WhatsApp Message</option>
            <option value="reminder">🔔 Follow-up Reminder</option>
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
            placeholder="e.g. Outreach Intern, Admin"
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col sm:col-span-2">
          <label className="text-[10px] text-gray-400 font-medium mb-1">Content / Details</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g., Phone Call Completed, Sent info packet..."
            rows={2}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500 resize-none"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
      >
        <Plus size={12} /> Add Activity
      </button>
    </form>
  )
}

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    college: "",
    source: "Instagram",
    status: "New" as LeadStatus,
    assignedTo: "",
    followUpDate: "",
    notes: "",
    phone: "",
    email: "",
    linkedIn: "",
  })

  const handleRowClick = (e: React.MouseEvent, lead: Lead) => {
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest("select") || target.closest("a") || target.closest(".group")) {
      return
    }
    setSelectedLead(lead)
  }

  const handleLogActivity = (type: ActivityType, content: string, performedBy: string, dateStr: string) => {
    if (!selectedLead) return
    const leadId = selectedLead.id
    const newActivity: Activity = {
      id: Date.now(),
      type,
      content,
      timestamp: dateStr || new Date().toISOString().split("T")[0],
      performedBy: performedBy || selectedLead.assignedTo || "Outreach Intern",
    }

    setLeads((prevLeads) =>
      prevLeads.map((l) => {
        if (l.id === leadId) {
          const updatedActivities = [...(l.activities || []), newActivity]
          // Update selectedLead detail modal state
          setSelectedLead((curr) => curr ? { ...curr, activities: updatedActivities } : null)
          return { ...l, activities: updatedActivities }
        }
        return l
      })
    )
  }

  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(new Date())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.college.toLowerCase().includes(search.toLowerCase()) ||
        lead.source.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === "All" || lead.status === statusFilter

      const matchesSource =
        sourceFilter === "All" || lead.source === sourceFilter

      return matchesSearch && matchesStatus && matchesSource
    })
  }, [leads, search, statusFilter, sourceFilter])

  const stats = useMemo(() => {
    return {
      total: leads.length,
      contacted: leads.filter((lead) => lead.status === "Contacted").length,
      interested: leads.filter((lead) => lead.status === "Interested").length,
      followUps: leads.filter((lead) => lead.status === "Follow-up Pending").length,
      converted: leads.filter((lead) => lead.status === "Converted").length,
    }
  }, [leads])

  const followUpStats = useMemo(() => {
    let overdue = 0
    let dueToday = 0
    let upcoming = 0

    leads.forEach((lead) => {
      if (lead.followUpDate && lead.followUpDate !== "Not set") {
        const status = getFollowUpStatus(lead.followUpDate, today)
        if (status.type === "overdue") overdue++
        else if (status.type === "today") dueToday++
        else if (status.type === "upcoming") upcoming++
      }
    })

    return { overdue, dueToday, upcoming }
  }, [leads, today])

  const addLead = () => {
    if (!form.name.trim() || !form.college.trim()) return

    const newLead: Lead = {
      id: Date.now(),
      name: form.name,
      college: form.college,
      source: form.source,
      status: form.status,
      assignedTo: form.assignedTo || "Not assigned",
      followUpDate: form.followUpDate || "Not set",
      notes: form.notes || "No notes added",
      phone: form.phone || "",
      email: form.email || "",
      linkedIn: form.linkedIn || "",
    }

    setLeads([newLead, ...leads])
    setForm({
      name: "",
      college: "",
      source: "Instagram",
      status: "New",
      assignedTo: "",
      followUpDate: "",
      notes: "",
      phone: "",
      email: "",
      linkedIn: "",
    })
    setShowForm(false)
  }

  const updateStatus = (id: number, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
    )
  }

  const deleteLead = (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
    )

    if (!confirmDelete) return

    setLeads((prev) => prev.filter((lead) => lead.id !== id))
  }

  const getStatusStyle = (status: LeadStatus) => {
    if (status === "Converted") return "bg-green-50 text-green-700"
    if (status === "Interested") return "bg-blue-50 text-blue-700"
    if (status === "Follow-up Pending") return "bg-orange-50 text-orange-700"
    if (status === "Contacted") return "bg-purple-50 text-purple-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student leads, follow-ups, and outreach status.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Lead
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Total Leads
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {stats.total}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Contacted
          </p>
          <h2 className="mt-2 text-3xl font-bold text-purple-600">
            {stats.contacted}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Interested
          </p>
          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {stats.interested}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Converted
          </p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {stats.converted}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Follow-ups Pending
          </p>
          <h2 className="mt-2 text-3xl font-bold text-orange-600">
            {stats.followUps}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Overdue Leads
          </p>
          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {followUpStats.overdue}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Due Today
          </p>
          <h2 className="mt-2 text-3xl font-bold text-amber-500">
            {followUpStats.dueToday}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Upcoming Follow-ups
          </p>
          <h2 className="mt-2 text-3xl font-bold text-emerald-600">
            {followUpStats.upcoming}
          </h2>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, college, or source"
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
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All Sources</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Add New Lead</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Student name"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.college}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
              placeholder="College name"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            >
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>

            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as LeadStatus })
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
              value={form.followUpDate}
              onChange={(e) =>
                setForm({ ...form, followUpDate: e.target.value })
              }
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.linkedIn}
              onChange={(e) => setForm({ ...form, linkedIn: e.target.value })}
              placeholder="LinkedIn profile URL"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2"
            />

            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={addLead}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Lead
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
          <h2 className="text-lg font-semibold text-gray-900">Lead Tracker</h2>
          <p className="mt-1 text-sm text-gray-500">
            Track student leads, assigned interns, and follow-up status.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">College</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Assigned To</th>
                <th className="px-5 py-3">Follow-up</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} onClick={(e) => handleRowClick(e, lead)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {lead.name}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {lead.phone ? (
                        <>
                          <SocialIconButton
                            icon={<WhatsAppIcon size={12} />}
                            href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                            tooltip={`WhatsApp: ${lead.phone}`}
                            colorClass="text-green-600 hover:bg-green-50 border-green-200"
                          />
                          <SocialIconButton
                            icon={<Phone size={12} />}
                            href={`tel:${lead.phone}`}
                            tooltip={`Call: ${lead.phone}`}
                            colorClass="text-blue-600 hover:bg-blue-50 border-blue-200"
                          />
                        </>
                      ) : (
                        <>
                          <SocialIconButton
                            icon={<WhatsAppIcon size={12} />}
                            tooltip="WhatsApp not provided"
                            colorClass="text-gray-300 border-gray-100 cursor-not-allowed"
                          />
                          <SocialIconButton
                            icon={<Phone size={12} />}
                            tooltip="Phone not provided"
                            colorClass="text-gray-300 border-gray-100 cursor-not-allowed"
                          />
                        </>
                      )}

                      {lead.email ? (
                        <SocialIconButton
                          icon={<Mail size={12} />}
                          href={`mailto:${lead.email}`}
                          tooltip={`Email: ${lead.email}`}
                          colorClass="text-red-500 hover:bg-red-50 border-red-200"
                        />
                      ) : (
                        <SocialIconButton
                          icon={<Mail size={12} />}
                          tooltip="Email not provided"
                          colorClass="text-gray-300 border-gray-100 cursor-not-allowed"
                        />
                      )}

                      {lead.linkedIn ? (
                        <SocialIconButton
                          icon={<Linkedin size={12} />}
                          href={lead.linkedIn}
                          tooltip="LinkedIn Profile"
                          colorClass="text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                        />
                      ) : (
                        <SocialIconButton
                          icon={<Linkedin size={12} />}
                          tooltip="LinkedIn not provided"
                          colorClass="text-gray-300 border-gray-100 cursor-not-allowed"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{lead.college}</td>
                  <td className="px-5 py-4 text-gray-600">{lead.source}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {lead.assignedTo}
                  </td>
                  <td className="px-5 py-4">
                    <FollowUpStatusBadge dateStr={lead.followUpDate} today={today} />
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        updateStatus(lead.id, e.target.value as LeadStatus)
                      }
                      className={`rounded-full px-3 py-1 text-xs font-semibold outline-none ${getStatusStyle(
                        lead.status
                      )}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{lead.notes}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => deleteLead(lead.id)}
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

        {filteredLeads.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            No leads found.
          </div>
        )}
      </div>

      {/* Activity Timeline Modal */}
      {selectedLead && (
        <Modal
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title={
            <span className="text-lg font-bold text-gray-900">
              Lead Details: {selectedLead.name}
            </span>
          }
          size="md"
        >
          <div className="space-y-6">
            {/* Quick Profile Summary */}
            <div className="bg-gray-50 rounded-xl p-4 border text-xs text-gray-600 grid gap-2 sm:grid-cols-2">
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider">College</span>
                <span className="text-gray-800 font-medium text-sm">{selectedLead.college}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider">Lead Source</span>
                <span className="text-gray-800 font-medium text-sm">{selectedLead.source}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider">Assigned Intern</span>
                <span className="text-gray-800 font-medium text-sm">{selectedLead.assignedTo}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400 block uppercase tracking-wider font-semibold">Status</span>
                <span className={`inline-block rounded-full px-2 py-0.5 mt-0.5 text-[10px] font-semibold ${getStatusStyle(selectedLead.status)}`}>
                  {selectedLead.status}
                </span>
              </div>
              {selectedLead.notes && (
                <div className="sm:col-span-2 border-t pt-2 mt-1">
                  <span className="font-semibold text-gray-400 block uppercase tracking-wider font-semibold">General Notes</span>
                  <p className="text-gray-700 italic mt-0.5">{selectedLead.notes}</p>
                </div>
              )}
            </div>

            {/* Activities Timeline */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wider">Activity History</h3>
              <LeadTimeline activities={selectedLead.activities || []} />
            </div>

            {/* Add Activity Form */}
            <AddActivityForm onAdd={handleLogActivity} />
          </div>
        </Modal>
      )}
    </div>
  )
}
