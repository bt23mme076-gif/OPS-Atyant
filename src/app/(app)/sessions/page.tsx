'use client'
import { useState } from 'react'
import { RefreshCw, CalendarClock, CalendarDays, CheckCircle2, IndianRupee, Video, ExternalLink } from 'lucide-react'
import { useGetAtyantSessionsQuery, useGetAtyantSessionStatsQuery, type AtyantSession } from '@/store/api/atyantSessionsApi'
import { Button, Badge, Avatar, Spinner, Empty } from '@/components/ui'
import { formatDateTime, cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  upcoming:  { bg: '#EFF6FF', color: '#1D4ED8', label: 'Upcoming' },
  pending:   { bg: '#FFF7ED', color: '#C2410C', label: 'Pending' },
  completed: { bg: '#F0FDF4', color: '#15803D', label: 'Completed' },
  cancelled: { bg: '#FEF2F2', color: '#B91C1C', label: 'Cancelled' },
}

function statusOf(s: AtyantSession): keyof typeof STATUS_STYLE {
  if (!s.status) return 'pending'
  if (s.status in STATUS_STYLE) return s.status as keyof typeof STATUS_STYLE
  return 'pending'
}

const PAY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  paid:    { bg: '#F0FDF4', color: '#15803D', label: 'Paid' },
  created: { bg: '#FFFBEB', color: '#B45309', label: 'Unpaid' },
}

const FILTERS = ['all', 'upcoming', 'pending', 'completed', 'cancelled'] as const
type Filter = typeof FILTERS[number]

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-4 flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  )
}

function isFuture(s: AtyantSession) {
  return s.scheduledAt ? new Date(s.scheduledAt).getTime() >= Date.now() : false
}

export default function SessionsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data: sessions = [], isLoading, isError, refetch, isFetching } = useGetAtyantSessionsQuery(
    filter === 'all' ? undefined : { status: filter }
  )
  const { data: stats } = useGetAtyantSessionStatsQuery()

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats ? `${stats.total} total · ${stats.upcoming} upcoming` : 'Live from MongoDB'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {/* Tracking stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Upcoming" value={stats?.upcoming ?? '—'} icon={<CalendarClock size={18} />} color="#2563EB" />
        <StatCard label="This Week" value={stats?.thisWeek ?? '—'} icon={<CalendarDays size={18} />} color="#7C3AED" />
        <StatCard label="Completed" value={stats?.completed ?? '—'} icon={<CheckCircle2 size={18} />} color="#16A34A" />
        <StatCard label="Paid Revenue" value={stats ? `₹${stats.paidRevenue.toLocaleString('en-IN')}` : '—'} icon={<IndianRupee size={18} />} color="#EA580C" />
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 text-xs rounded-md font-medium transition-all capitalize',
              filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300')}>
            {f}
            {f !== 'all' && stats ? <span className="ml-1.5 opacity-60">{(stats as any)[f] ?? 0}</span> : null}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="card p-8 text-center">
          <p className="text-gray-700 font-medium text-sm">Couldn’t load sessions</p>
          <p className="text-gray-400 text-xs mt-1">The <code>/atyant/sessions</code> endpoint didn’t respond. Make sure the backend is running on <code>localhost:4000</code>.</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : sessions.length === 0 ? (
        <Empty title="No sessions found" description="Nothing matches this filter." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Student', 'Mentor', 'Topic', 'Scheduled', 'Duration', 'Amount', 'Payment', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => {
                const st = STATUS_STYLE[statusOf(s)]
                const pay = s.paymentStatus ? PAY_STYLE[s.paymentStatus] : undefined
                const joinable = isFuture(s) && statusOf(s) === 'upcoming' && s.meetingLink
                return (
                  <tr key={s._id} className={cn('border-b border-gray-50 hover:bg-gray-50 transition-colors', i === sessions.length - 1 && 'border-0')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.studentName ?? 'Unknown'} size={28} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{s.studentName ?? '—'}</p>
                          {s.studentEmail && <p className="text-xs text-gray-400 truncate">{s.studentEmail}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.mentorName ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.topic ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.scheduledAt ? formatDateTime(s.scheduledAt) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.durationMin ? `${s.durationMin} min` : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{typeof s.amount === 'number' ? `₹${s.amount}` : '—'}</td>
                    <td className="px-4 py-3">
                      {pay ? <Badge bgColor={pay.bg} textColor={pay.color}>{pay.label}</Badge> : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge bgColor={st.bg} textColor={st.color}>{st.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {joinable ? (
                        <a href={s.meetingLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
                          <Video size={13} /> Join <ExternalLink size={11} />
                        </a>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
