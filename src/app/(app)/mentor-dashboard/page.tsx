'use client'
import { useMemo, useState } from 'react'
import {
  Users, TrendingUp, Wifi, BadgeCheck, Eye, Gauge, RefreshCw, Search,
  AlertTriangle, ChevronRight, ChevronLeft, Linkedin, CheckCircle2, XCircle, X,
  Video, Phone, MessageCircle,
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  useGetAtyantMentorsQuery, useGetAtyantStatsQuery,
  scoreProfile, completionPct, mentorName, isActive, mentorServices,
  type RawMentor,
} from '@/store/api/mentorDashboardApi'
import { Spinner, Empty, Button, Avatar, Badge } from '@/components/ui'
import { useCurrentUser } from '@/store/hooks'
import { ROLES } from '@/lib/constants'
import { formatRelative, cn } from '@/lib/utils'

const PURPLE = '#7C3AED'
const PALETTE = ['#7C3AED', '#2563EB', '#16A34A', '#EA580C', '#DB2777', '#0891B2', '#CA8A04', '#6B7280']

// ── Small building blocks ─────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string
}) {
  return (
    <div className="card p-4 flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('card p-4', className)}>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function domainOf(m: RawMentor): string {
  const d = m.primaryDomain || m.companyDomain ||
    (Array.isArray(m.expertise) ? m.expertise[0] : m.expertise)
  return (d && String(d).trim()) ? String(d) : 'Unspecified'
}

// ── Drill-down drawer ─────────────────────────────────────────────────────────
function MentorDrawer({ mentor, onClose }: { mentor: RawMentor; onClose: () => void }) {
  const fields = scoreProfile(mentor)
  const pct = completionPct(mentor)
  const filled = fields.filter(f => f.filled)
  const missing = fields.filter(f => !f.filled)

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={mentorName(mentor)} size={44} bg={PURPLE} />
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-base truncate">{mentorName(mentor)}</h2>
              {mentor.email && <p className="text-sm text-gray-500 truncate">{mentor.email}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1"><X size={18} /></button>
        </div>

        {/* Completion ring */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Profile Completion</p>
            <span className="text-sm font-bold" style={{ color: PURPLE }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PURPLE }} />
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
            {mentor.isVerified && <Badge bgColor="#F0FDF4" textColor="#15803D" color="#16A34A">Verified</Badge>}
            {mentor.mentorListed && <Badge bgColor="#F5F3FF" textColor="#7C3AED" color="#8B5CF6">Listed</Badge>}
            {isActive(mentor) ? <Badge bgColor="#EFF6FF" textColor="#1D4ED8" color="#3B82F6">Active 7d</Badge>
              : <Badge bgColor="#F9FAFB" textColor="#6B7280" color="#9CA3AF">Inactive</Badge>}
            {mentor.isOnline && <Badge bgColor="#ECFEFF" textColor="#0E7490" color="#06B6D4">Online</Badge>}
          </div>
        </div>

        {/* Filled vs missing */}
        <div className="p-5 space-y-5">
          <div>
            <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide mb-2">Completed ({filled.length})</p>
            <div className="space-y-1.5">
              {filled.map(f => (
                <div key={f.key} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" /> {f.label}
                </div>
              ))}
              {filled.length === 0 && <p className="text-xs text-gray-400">Nothing filled yet.</p>}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wide mb-2">Missing ({missing.length})</p>
            <div className="space-y-1.5">
              {missing.map(f => (
                <div key={f.key} className="flex items-center gap-2 text-sm text-gray-500">
                  <XCircle size={14} className="text-red-400 flex-shrink-0" /> {f.label}
                </div>
              ))}
              {missing.length === 0 && <p className="text-xs text-gray-400">Profile is fully complete. 🎉</p>}
            </div>
          </div>

          {/* Meta */}
          <div className="pt-4 border-t border-gray-100 space-y-3 text-xs text-gray-500">
            {mentor.linkedinProfile && (
              <a href={mentor.linkedinProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                <Linkedin size={13} /> LinkedIn Profile
              </a>
            )}
            <p>Domain: <span className="text-gray-700 font-medium">{domainOf(mentor)}</span></p>

            {/* Services */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Services</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const svc = mentorServices(mentor)
                  const any = svc.video || svc.audio || svc.chat
                  return <>
                    <span className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border',
                      svc.video ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50')}>
                      <Video size={11} /> Video Call
                    </span>
                    <span className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border',
                      svc.audio ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50')}>
                      <Phone size={11} /> Audio Call
                    </span>
                    <span className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border',
                      svc.chat ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50')}>
                      <MessageCircle size={11} /> Chat
                    </span>
                    {!any && <span className="text-[11px] text-gray-400 italic">No services configured</span>}
                  </>
                })()}
              </div>
            </div>

            {mentor.lastActive && <p>Last active: <span className="text-gray-700">{formatRelative(mentor.lastActive)}</span></p>}
            {mentor.createdAt && <p>Joined: <span className="text-gray-700">{formatRelative(mentor.createdAt)}</span></p>}
          </div>
        </div>
      </div>
    </div>
  )
}

type SortKey = 'name' | 'completion' | 'lastActive'
const PAGE_SIZE = 20

export default function MentorDashboardPage() {
  const user = useCurrentUser()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const { data: mentors = [], isLoading, isError, refetch, isFetching } = useGetAtyantMentorsQuery(undefined, { skip: !isSuperAdmin })
  const { data: stats } = useGetAtyantStatsQuery(undefined, { skip: !isSuperAdmin })

  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'verified' | 'listed' | 'incomplete'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('completion')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<RawMentor | undefined>()

  // ── Derived analytics ──
  const analytics = useMemo(() => {
    const total = mentors.length
    const active = mentors.filter(m => isActive(m)).length
    const online = mentors.filter(m => m.isOnline).length
    const verified = mentors.filter(m => m.isVerified).length
    const listed = mentors.filter(m => m.mentorListed).length
    const pcts = mentors.map(completionPct)
    const avgCompletion = total ? Math.round(pcts.reduce((a, b) => a + b, 0) / total) : 0

    // Completion distribution buckets
    const buckets = [
      { name: '0–25%', range: [0, 25], count: 0 },
      { name: '26–50%', range: [26, 50], count: 0 },
      { name: '51–75%', range: [51, 75], count: 0 },
      { name: '76–99%', range: [76, 99], count: 0 },
      { name: '100%', range: [100, 100], count: 0 },
    ]
    pcts.forEach(p => {
      const b = buckets.find(b => p >= b.range[0] && p <= b.range[1])
      if (b) b.count++
    })

    // Domain breakdown (top 7 + Other)
    const domMap = new Map<string, number>()
    mentors.forEach(m => { const d = domainOf(m); domMap.set(d, (domMap.get(d) ?? 0) + 1) })
    const domSorted = [...domMap.entries()].sort((a, b) => b[1] - a[1])
    const domains = domSorted.slice(0, 7).map(([name, value]) => ({ name, value }))
    const otherTotal = domSorted.slice(7).reduce((a, [, v]) => a + v, 0)
    if (otherTotal) domains.push({ name: 'Other', value: otherTotal })

    const activeVsInactive = [
      { name: 'Active (7d)', value: active },
      { name: 'Inactive', value: total - active },
    ]

    // Signups trend — last 6 months
    const now = new Date()
    const months: { name: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ name: d.toLocaleString('en', { month: 'short' }), count: 0 })
    }
    mentors.forEach(m => {
      if (!m.createdAt) return
      const c = new Date(m.createdAt)
      const idx = (now.getFullYear() - c.getFullYear()) * 12 + (now.getMonth() - c.getMonth())
      if (idx >= 0 && idx <= 5) months[5 - idx].count++
    })

    // Alerts
    const alerts = {
      incomplete: mentors.filter(m => completionPct(m) < 50).length,
      notListed: mentors.filter(m => !m.mentorListed).length,
      stale: mentors.filter(m => !isActive(m, 30)).length,
      unverified: mentors.filter(m => !m.isVerified).length,
    }

    const domainOptions = domSorted.map(([d]) => d)

    return { total, active, online, verified, listed, avgCompletion, buckets, domains, activeVsInactive, months, alerts, domainOptions }
  }, [mentors])

  // ── Table filtering / sorting / pagination ──
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const rows = mentors.filter(m => {
      if (domainFilter !== 'all' && domainOf(m) !== domainFilter) return false
      if (statusFilter === 'active' && !isActive(m)) return false
      if (statusFilter === 'inactive' && isActive(m)) return false
      if (statusFilter === 'verified' && !m.isVerified) return false
      if (statusFilter === 'listed' && !m.mentorListed) return false
      if (statusFilter === 'incomplete' && completionPct(m) >= 50) return false
      if (s) {
        return mentorName(m).toLowerCase().includes(s) ||
          (m.email ?? '').toLowerCase().includes(s) ||
          domainOf(m).toLowerCase().includes(s)
      }
      return true
    })
    rows.sort((a, b) => {
      if (sortKey === 'name') return mentorName(a).localeCompare(mentorName(b))
      if (sortKey === 'lastActive')
        return new Date(b.lastActive ?? 0).getTime() - new Date(a.lastActive ?? 0).getTime()
      return completionPct(b) - completionPct(a)
    })
    return rows
  }, [mentors, search, domainFilter, statusFilter, sortKey])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(0) }
  }

  if (!isSuperAdmin) return (
    <div className="card p-10 text-center">
      <AlertTriangle className="mx-auto text-amber-500 mb-3" size={28} />
      <p className="text-gray-700 font-medium text-sm">Restricted</p>
      <p className="text-gray-400 text-xs mt-1">The Mentor Dashboard is available to Super Admins only.</p>
    </div>
  )

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size={28} /></div>

  if (isError) return (
    <div className="card p-8 text-center">
      <AlertTriangle className="mx-auto text-amber-500 mb-3" size={28} />
      <p className="text-gray-700 font-medium text-sm">Couldn’t load mentor data</p>
      <p className="text-gray-400 text-xs mt-1">The <code>/atyant/mentors</code> endpoint did not respond. Check that the backend is running.</p>
      <Button variant="primary" size="sm" className="mt-4" onClick={() => refetch()}>Retry</Button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mentor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {analytics.total} mentors · {analytics.avgCompletion}% avg profile completion
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Mentors" value={stats?.totalMentors ?? analytics.total} icon={<Users size={18} />} color="#7C3AED" />
        <StatCard label="Active (7d)" value={analytics.active} icon={<TrendingUp size={18} />} color="#16A34A" />
        <StatCard label="Online Now" value={stats?.onlineMentors ?? analytics.online} icon={<Wifi size={18} />} color="#0891B2" />
        <StatCard label="Verified" value={analytics.verified} icon={<BadgeCheck size={18} />} color="#2563EB" />
        <StatCard label="Listed" value={analytics.listed} icon={<Eye size={18} />} color="#DB2777" />
        <StatCard label="Avg Complete" value={`${analytics.avgCompletion}%`} icon={<Gauge size={18} />} color="#EA580C" />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Incomplete profiles (<50%)', value: analytics.alerts.incomplete, color: '#DC2626', filter: 'incomplete' as const },
          { label: 'Not listed publicly', value: analytics.alerts.notListed, color: '#D97706', filter: 'listed' as const },
          { label: 'Inactive >30 days', value: analytics.alerts.stale, color: '#6B7280', filter: 'inactive' as const },
          { label: 'Pending verification', value: analytics.alerts.unverified, color: '#7C3AED', filter: 'verified' as const },
        ].map(a => (
          <button key={a.label}
            onClick={() => { setStatusFilter(a.filter); setPage(0) }}
            className="card card-hover p-4 text-left">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} style={{ color: a.color }} />
              <span className="text-xl font-bold text-gray-900">{a.value}</span>
            </div>
            <p className="text-[11px] text-gray-500">{a.label}</p>
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Profile Completion Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.buckets} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {analytics.buckets.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Active vs Inactive">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={analytics.activeVsInactive} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                <Cell fill="#16A34A" />
                <Cell fill="#E2E8F0" />
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-gray-600 -mt-2">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Active {analytics.active}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Inactive {analytics.total - analytics.active}</span>
          </div>
        </ChartCard>

        <ChartCard title="Mentors by Domain">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={analytics.domains} margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {analytics.domains.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Signups (last 6 months)">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={analytics.months} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Area type="monotone" dataKey="count" stroke={PURPLE} strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Table controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 text-sm" placeholder="Search name, email, domain…"
            value={search} onChange={e => resetPage(setSearch)(e.target.value)} />
        </div>
        <select className="input sm:w-44 text-sm" value={domainFilter} onChange={e => resetPage(setDomainFilter)(e.target.value)}>
          <option value="all">All Domains</option>
          {analytics.domainOptions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input sm:w-44 text-sm" value={statusFilter} onChange={e => resetPage((v: typeof statusFilter) => setStatusFilter(v))(e.target.value as typeof statusFilter)}>
          <option value="all">All Statuses</option>
          <option value="active">Active (7d)</option>
          <option value="inactive">Inactive</option>
          <option value="verified">Verified</option>
          <option value="listed">Listed</option>
          <option value="incomplete">Incomplete (&lt;50%)</option>
        </select>
        <select className="input sm:w-44 text-sm" value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}>
          <option value="completion">Sort: Completion</option>
          <option value="name">Sort: Name</option>
          <option value="lastActive">Sort: Last Active</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Empty title="No mentors match" description="Try clearing filters or search." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Mentor', 'Domain', 'Completion', 'Status', 'Services', 'Last Active', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((m, i) => {
                  const pct = completionPct(m)
                  return (
                    <tr key={m._id} onClick={() => setSelected(m)}
                      className={cn('border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors', i === pageRows.length - 1 && 'border-0')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={mentorName(m)} size={30} bg={PURPLE} />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{mentorName(m)}</p>
                            {m.email && <p className="text-xs text-gray-400 truncate">{m.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{domainOf(m)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 75 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626' }} />
                          </div>
                          <span className="text-xs text-gray-500 tabular-nums">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {m.isVerified && <Badge bgColor="#EFF6FF" textColor="#1D4ED8" color="#3B82F6">Verified</Badge>}
                          {m.mentorListed && <Badge bgColor="#F5F3FF" textColor="#7C3AED" color="#8B5CF6">Listed</Badge>}
                          {isActive(m)
                            ? <Badge bgColor="#F0FDF4" textColor="#15803D" color="#16A34A">Active</Badge>
                            : <Badge bgColor="#F9FAFB" textColor="#6B7280" color="#9CA3AF">Inactive</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const svc = mentorServices(m)
                          return (
                            <div className="flex items-center gap-1.5">
                              <span title="Video Call" className={svc.video ? 'text-purple-600' : 'text-gray-200'}><Video size={13} /></span>
                              <span title="Audio Call" className={svc.audio ? 'text-blue-500' : 'text-gray-200'}><Phone size={13} /></span>
                              <span title="Chat" className={svc.chat ? 'text-green-500' : 'text-gray-200'}><MessageCircle size={13} /></span>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{m.lastActive ? formatRelative(m.lastActive) : '—'}</td>
                      <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-300" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>
              Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="xs" disabled={safePage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <ChevronLeft size={14} />
              </Button>
              <span className="px-2">Page {safePage + 1} / {pageCount}</span>
              <Button variant="ghost" size="xs" disabled={safePage >= pageCount - 1} onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}

      {selected && <MentorDrawer mentor={selected} onClose={() => setSelected(undefined)} />}
    </div>
  )
}
