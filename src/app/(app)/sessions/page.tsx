'use client'
import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useGetSessionsQuery } from '@/store/api/sessionsApi'
import { Button, Badge, Spinner, Empty } from '@/components/ui'
import { formatDateTime, cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  scheduled:  { bg: '#EFF6FF', color: '#1D4ED8' },
  completed:  { bg: '#F0FDF4', color: '#15803D' },
  cancelled:  { bg: '#FEF2F2', color: '#B91C1C' },
  no_show:    { bg: '#FFF7ED', color: '#C2410C' },
}

export default function SessionsPage() {
  const [statusFilter, setStatus] = useState('all')
  const { data: sessions = [], isLoading, refetch } = useGetSessionsQuery()

  const filtered = statusFilter === 'all' ? sessions : sessions.filter(s => s.status === statusFilter)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sessions.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw size={13} /></Button>
          <Button variant="primary" size="sm"><Plus size={13} /> Book Session</Button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {['all', 'scheduled', 'completed', 'cancelled', 'no_show'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={cn('px-3 py-1.5 text-xs rounded-md font-medium transition-all capitalize', statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300')}>
            {s === 'no_show' ? 'No Show' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner /></div> :
       filtered.length === 0 ? <Empty title="No sessions found" /> : (
        <div className="card overflow-x-auto whitespace-nowrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Student', 'Mentor', 'Type', 'Scheduled', 'Status', 'Rating'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const style = STATUS_STYLE[s.status] ?? { bg: '#F9FAFB', color: '#4B5563' }
                return (
                  <tr key={s.id} className={cn('border-b border-gray-50 hover:bg-gray-50', i === filtered.length - 1 && 'border-0')}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.student?.name ?? s.studentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.mentor?.name ?? s.mentorId}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{s.type} · {s.format}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDateTime(s.scheduledAt)}</td>
                    <td className="px-4 py-3">
                      <Badge bgColor={style.bg} textColor={style.color} className="capitalize">{s.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.rating ? `${s.rating}/5` : '—'}</td>
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
