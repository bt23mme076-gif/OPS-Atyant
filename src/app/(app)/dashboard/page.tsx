'use client'
import { Users, GraduationCap, Video, CheckSquare, TrendingUp, Clock } from 'lucide-react'
import { useGetDashboardQuery } from '@/store/api/dashboardApi'
import { Spinner } from '@/components/ui'
import { formatRelative } from '@/lib/utils'

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '20', color }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardQuery()

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size={28} /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of Atyant operations</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Mentors"     value={data?.totalMentors ?? '—'}     icon={<Users size={18} />}          color="#2563EB" />
        <StatCard label="Active Mentors"    value={data?.activeMentors ?? '—'}    icon={<TrendingUp size={18} />}     color="#16A34A" />
        <StatCard label="Total Students"    value={data?.totalStudents ?? '—'}    icon={<GraduationCap size={18} />}  color="#7C3AED" />
        <StatCard label="Active Students"   value={data?.activeStudents ?? '—'}   icon={<TrendingUp size={18} />}     color="#D97706" />
        <StatCard label="Sessions This Week" value={data?.sessionsThisWeek ?? '—'} icon={<Video size={18} />}         color="#0891B2" />
        <StatCard label="Pending Tasks"     value={data?.pendingTasks ?? '—'}     icon={<CheckSquare size={18} />}    color="#DC2626" />
      </div>

      {/* Recent activity */}
      {data?.recentActivity && data.recentActivity.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={11} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelative(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && (
        <div className="card p-10 text-center">
          <p className="text-gray-500 text-sm">No data available. Make sure your backend is running.</p>
        </div>
      )}
    </div>
  )
}
