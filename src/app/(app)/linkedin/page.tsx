"use client"

import { useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  useGetLinkedinStatsQuery,
  useGetLinkedinPostsQuery,
  useCreateLinkedinPostMutation,
  useUpdateLinkedinPostMutation,
  useDeleteLinkedinPostMutation,
  useGetLinkedinLeadsQuery,
  useCreateLinkedinLeadMutation,
  useUpdateLinkedinLeadStageMutation,
  useConvertLinkedinLeadMutation,
  useDeleteLinkedinLeadMutation,
} from "@/store/api/linkedinApi"
import { useGetUsersQuery } from "@/store/api/usersApi"
import {
  LINKEDIN_POST_STATUSES,
  LINKEDIN_POST_FORMATS,
  LINKEDIN_LEAD_STAGES,
  LINKEDIN_LEAD_TYPES,
  LINKEDIN_ENGAGEMENT_TYPES,
} from "@/lib/constants"
import type { LinkedinPost, LinkedinLead } from "@/types"

const postStatusStyle = (s: string) =>
  LINKEDIN_POST_STATUSES.find((x) => x.key === s) ?? LINKEDIN_POST_STATUSES[0]
const leadStageStyle = (s: string) =>
  LINKEDIN_LEAD_STAGES.find((x) => x.key === s) ?? LINKEDIN_LEAD_STAGES[0]

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <h2 className="mt-2 text-3xl font-bold" style={{ color: accent ?? "#111827" }}>
        {value}
      </h2>
    </div>
  )
}

export default function LinkedinPage() {
  const [tab, setTab] = useState<"posts" | "leads">("posts")

  const { data: stats } = useGetLinkedinStatsQuery()
  const { data: posts = [] } = useGetLinkedinPostsQuery()
  const { data: leads = [] } = useGetLinkedinLeadsQuery()
  const { data: users = [] } = useGetUsersQuery()

  const userName = (id?: string | null) =>
    users.find((u) => u.id === id)?.name ?? "Unassigned"
  const postTitle = (id?: string | null) =>
    posts.find((p) => p.id === id)?.title ?? "—"

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Growth</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track posts, engagement, and the leads each post generates — post → lead → pipeline.
          </p>
        </div>
        {stats && (
          <div
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              background: stats.cadence.onTrack ? "#F0FDF4" : "#FEF2F2",
              color: stats.cadence.onTrack ? "#15803D" : "#B91C1C",
            }}
          >
            {stats.cadence.postedThisWeek}/{stats.cadence.weeklyTarget} posts this week
            {stats.cadence.onTrack ? " — on track" : " — behind cadence"}
          </div>
        )}
      </div>

      {/* ─── Dashboard ─── */}
      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Published" value={stats.totals.published} accent="#16A34A" />
            <StatCard label="Impressions" value={stats.totals.impressions.toLocaleString()} accent="#2563EB" />
            <StatCard label="Engagement" value={`${stats.engagementRate}%`} accent="#8B5CF6" />
            <StatCard label="Followers +" value={stats.totals.followersGained} accent="#0EA5E9" />
            <StatCard label="Leads / Post" value={stats.leadsPerPost} accent="#F97316" />
            <StatCard label="Conversion" value={`${stats.conversionRate}%`} accent="#16A34A" />
          </div>

          {stats.formatPerformance.length > 0 && (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-gray-400">Best Formats (by engagement rate)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {stats.formatPerformance.map((f) => (
                  <span key={f.format} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {titleCase(f.format)} · {f.engagementRate}% · {f.posts} posts
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Tabs ─── */}
      <div className="flex gap-2 border-b">
        {(["posts", "leads"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "posts" ? `Posts (${posts.length})` : `Leads (${leads.length})`}
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        <PostsTab posts={posts} users={users} userName={userName} />
      ) : (
        <LeadsTab leads={leads} posts={posts} users={users} userName={userName} postTitle={postTitle} />
      )}
    </div>
  )
}

/* ════════════════════════════ POSTS ════════════════════════════ */

function PostsTab({
  posts,
  users,
  userName,
}: {
  posts: LinkedinPost[]
  users: { id: string; name: string }[]
  userName: (id?: string | null) => string
}) {
  const [createPost] = useCreateLinkedinPostMutation()
  const [updatePost] = useUpdateLinkedinPostMutation()
  const [deletePost] = useDeleteLinkedinPostMutation()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [showForm, setShowForm] = useState(false)
  const [metricsFor, setMetricsFor] = useState<LinkedinPost | null>(null)

  const emptyForm = { title: "", topic: "", hook: "", format: "text", status: "idea", authorId: "", postUrl: "" }
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          (p.topic ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (p.hook ?? "").toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "All" || p.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [posts, search, statusFilter]
  )

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Title is required")
    try {
      await createPost({
        title: form.title,
        topic: form.topic || undefined,
        hook: form.hook || undefined,
        format: form.format as LinkedinPost["format"],
        status: form.status as LinkedinPost["status"],
        authorId: form.authorId || undefined,
        postUrl: form.postUrl || undefined,
      }).unwrap()
      toast.success("Post added")
      setForm(emptyForm)
      setShowForm(false)
    } catch {
      toast.error("Failed to add post")
    }
  }

  const changeStatus = async (id: string, status: string) => {
    try {
      await updatePost({ id, data: { status: status as LinkedinPost["status"] } }).unwrap()
    } catch {
      toast.error("Failed to update")
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this post? Attributed leads will be kept but detached.")) return
    try {
      await deletePost(id).unwrap()
      toast.success("Post deleted")
    } catch {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, topic, hook"
          className="flex-1 min-w-[200px] rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="All">All Status</option>
          {LINKEDIN_POST_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Close" : "Add Post"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Internal title (e.g. 'Kota drop-year story')"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2" />
            <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="Topic / content pillar"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500" />
            <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500">
              {LINKEDIN_POST_FORMATS.map((f) => <option key={f} value={f}>{titleCase(f)}</option>)}
            </select>
            <input value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })}
              placeholder="Hook — first line that stops the scroll"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500">
              {LINKEDIN_POST_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select value={form.authorId} onChange={(e) => setForm({ ...form, authorId: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500">
              <option value="">Author (whose profile)</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input value={form.postUrl} onChange={(e) => setForm({ ...form, postUrl: e.target.value })}
              placeholder="Published URL (once live)"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2" />
          </div>
          <div className="mt-4">
            <button onClick={submit}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Post
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Post</th>
                <th className="px-5 py-3">Format</th>
                <th className="px-5 py-3">Author</th>
                <th className="px-5 py-3">Impr.</th>
                <th className="px-5 py-3">Eng. %</th>
                <th className="px-5 py-3">Leads</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => {
                const st = postStatusStyle(p.status)
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{p.title}</div>
                      {p.topic && <div className="text-xs text-gray-400">{p.topic}</div>}
                      {p.postUrl && (
                        <a href={p.postUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                          View on LinkedIn ↗
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{titleCase(p.format)}</td>
                    <td className="px-5 py-4 text-gray-600">{userName(p.authorId)}</td>
                    <td className="px-5 py-4 text-gray-600">{p.impressions.toLocaleString()}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{p.engagementRate ?? 0}%</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        {p.leadsGenerated}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select value={p.status} onChange={(e) => changeStatus(p.id, e.target.value)}
                        className="rounded-full px-3 py-1 text-xs font-semibold outline-none"
                        style={{ background: st.bgColor, color: st.textColor }}>
                        {LINKEDIN_POST_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setMetricsFor(p)}
                          className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100">
                          Metrics
                        </button>
                        <button onClick={() => remove(p.id)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">No posts yet. Add your first one.</div>
        )}
      </div>

      {metricsFor && (
        <MetricsModal post={metricsFor} onClose={() => setMetricsFor(null)} onSaved={() => setMetricsFor(null)} />
      )}
    </div>
  )
}

function MetricsModal({ post, onClose, onSaved }: { post: LinkedinPost; onClose: () => void; onSaved: () => void }) {
  const [updatePost, { isLoading }] = useUpdateLinkedinPostMutation()
  const [m, setM] = useState({
    impressions: post.impressions,
    reactions: post.reactions,
    comments: post.comments,
    reposts: post.reposts,
    profileViews: post.profileViews,
    followersGained: post.followersGained,
  })

  const fields: { key: keyof typeof m; label: string }[] = [
    { key: "impressions", label: "Impressions" },
    { key: "reactions", label: "Reactions" },
    { key: "comments", label: "Comments" },
    { key: "reposts", label: "Reposts" },
    { key: "profileViews", label: "Profile Views" },
    { key: "followersGained", label: "Followers Gained" },
  ]

  const save = async () => {
    try {
      await updatePost({ id: post.id, data: m }).unwrap()
      toast.success("Metrics updated")
      onSaved()
    } catch {
      toast.error("Failed to save metrics")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900">Engagement Metrics</h2>
        <p className="mt-1 text-sm text-gray-500">{post.title} — enter numbers from LinkedIn analytics.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold uppercase text-gray-400">{f.label}</label>
              <input type="number" min={0} value={m[f.key]}
                onChange={(e) => setM({ ...m, [f.key]: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={isLoading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            Save
          </button>
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════ LEADS ════════════════════════════ */

function LeadsTab({
  leads,
  posts,
  users,
  userName,
  postTitle,
}: {
  leads: LinkedinLead[]
  posts: LinkedinPost[]
  users: { id: string; name: string }[]
  userName: (id?: string | null) => string
  postTitle: (id?: string | null) => string
}) {
  const [createLead] = useCreateLinkedinLeadMutation()
  const [updateStage] = useUpdateLinkedinLeadStageMutation()
  const [convertLead] = useConvertLinkedinLeadMutation()
  const [deleteLead] = useDeleteLinkedinLeadMutation()

  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState("All")
  const [showForm, setShowForm] = useState(false)

  const emptyForm = {
    name: "", headline: "", linkedinUrl: "", email: "",
    leadType: "student", engagementType: "comment", sourcePostId: "", assignedToId: "",
  }
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        const matchesSearch =
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          (l.headline ?? "").toLowerCase().includes(search.toLowerCase())
        const matchesStage = stageFilter === "All" || l.stage === stageFilter
        return matchesSearch && matchesStage
      }),
    [leads, search, stageFilter]
  )

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name is required")
    try {
      await createLead({
        name: form.name,
        headline: form.headline || undefined,
        linkedinUrl: form.linkedinUrl || undefined,
        email: form.email || undefined,
        leadType: form.leadType as LinkedinLead["leadType"],
        engagementType: form.engagementType as LinkedinLead["engagementType"],
        sourcePostId: form.sourcePostId || undefined,
        assignedToId: form.assignedToId || undefined,
      }).unwrap()
      toast.success("Lead added")
      setForm(emptyForm)
      setShowForm(false)
    } catch {
      toast.error("Failed to add lead")
    }
  }

  const changeStage = async (id: string, stage: string) => {
    try {
      await updateStage({ id, stage }).unwrap()
    } catch {
      toast.error("Failed to update stage")
    }
  }

  const convert = async (lead: LinkedinLead) => {
    const target = lead.leadType === "mentor" ? "mentor" : "student"
    if (!confirm(`Convert "${lead.name}" into a ${target} record in the pipeline?`)) return
    try {
      await convertLead({ id: lead.id, target }).unwrap()
      toast.success(`Converted to ${target}`)
    } catch {
      toast.error("Conversion failed")
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return
    try {
      await deleteLead(id).unwrap()
      toast.success("Lead deleted")
    } catch {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or headline"
          className="flex-1 min-w-[200px] rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500" />
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500">
          <option value="All">All Stages</option>
          {LINKEDIN_LEAD_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showForm ? "Close" : "Add Lead"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500" />
            <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="Headline / role"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500" />
            <input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
              placeholder="LinkedIn profile URL"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email (optional)"
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500" />
            <select value={form.leadType} onChange={(e) => setForm({ ...form, leadType: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500">
              {LINKEDIN_LEAD_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </select>
            <select value={form.engagementType} onChange={(e) => setForm({ ...form, engagementType: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500">
              {LINKEDIN_ENGAGEMENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </select>
            <select value={form.sourcePostId} onChange={(e) => setForm({ ...form, sourcePostId: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500">
              <option value="">Source post (attribution)</option>
              {posts.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500">
              <option value="">Assign to</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="mt-4">
            <button onClick={submit}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Lead
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Lead</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Source Post</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((l) => {
                const st = leadStageStyle(l.stage)
                const converted = l.stage === "converted" || !!l.convertedToId
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{l.name}</div>
                      {l.headline && <div className="text-xs text-gray-400">{l.headline}</div>}
                      {l.linkedinUrl && (
                        <a href={l.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                          Profile ↗
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{titleCase(l.leadType)}</td>
                    <td className="px-5 py-4 text-gray-600">{l.sourcePostId ? postTitle(l.sourcePostId) : "—"}</td>
                    <td className="px-5 py-4 text-gray-600">{userName(l.assignedToId)}</td>
                    <td className="px-5 py-4">
                      <select value={l.stage} onChange={(e) => changeStage(l.id, e.target.value)}
                        disabled={converted}
                        className="rounded-full px-3 py-1 text-xs font-semibold outline-none disabled:opacity-70"
                        style={{ background: st.bgColor, color: st.textColor }}>
                        {LINKEDIN_LEAD_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {converted ? (
                          <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            → {l.convertedToType ?? "pipeline"}
                          </span>
                        ) : (
                          <button onClick={() => convert(l)}
                            className="rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100">
                            Convert
                          </button>
                        )}
                        <button onClick={() => remove(l.id)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            No leads yet. Add people who engaged with your posts.
          </div>
        )}
      </div>
    </div>
  )
}
