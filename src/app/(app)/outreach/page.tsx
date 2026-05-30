"use client"

import { useMemo, useState } from "react"

type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Follow-up Pending"
  | "Converted"

type Lead = {
  id: number
  name: string
  college: string
  source: string
  status: LeadStatus
  assignedTo: string
  followUpDate: string
  notes: string
}

const initialLeads: Lead[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    college: "Malla Reddy University",
    source: "Instagram",
    status: "Interested",
    assignedTo: "Outreach Intern",
    followUpDate: "2026-05-30",
    notes: "Interested in placement roadmap",
  },
  {
    id: 2,
    name: "Sneha Reddy",
    college: "CMR Engineering College",
    source: "WhatsApp",
    status: "Contacted",
    assignedTo: "Outreach Intern",
    followUpDate: "2026-05-29",
    notes: "Asked for senior mentor details",
  },
  {
    id: 3,
    name: "Rahul Verma",
    college: "VNR VJIET",
    source: "Referral",
    status: "Follow-up Pending",
    assignedTo: "Outreach Intern",
    followUpDate: "2026-05-31",
    notes: "Needs reminder message",
  },
  {
    id: 4,
    name: "Meghana Rao",
    college: "GNITS",
    source: "College Campaign",
    status: "Converted",
    assignedTo: "Outreach Intern",
    followUpDate: "2026-05-28",
    notes: "Joined after demo",
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

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
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
  })

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

  const stats = {
    total: leads.length,
    contacted: leads.filter((lead) => lead.status === "Contacted").length,
    interested: leads.filter((lead) => lead.status === "Interested").length,
    followUps: leads.filter((lead) => lead.status === "Follow-up Pending")
      .length,
    converted: leads.filter((lead) => lead.status === "Converted").length,
  }

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

      <div className="grid gap-4 md:grid-cols-5">
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
            Follow-ups
          </p>
          <h2 className="mt-2 text-3xl font-bold text-orange-600">
            {stats.followUps}
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
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {lead.name}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{lead.college}</td>
                  <td className="px-5 py-4 text-gray-600">{lead.source}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {lead.assignedTo}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {lead.followUpDate}
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
    </div>
  )
}