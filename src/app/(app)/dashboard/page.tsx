'use client'
import { useMemo } from 'react'
import {
  Users, GraduationCap, CalendarClock, TrendingUp, Wifi,
  Flame, Megaphone, Trophy, Zap, ThumbsUp, MessageCircle, ExternalLink,
  Sparkles, Heart, Eye,
} from 'lucide-react'
import { useGetAtyantStatsQuery } from '@/store/api/mentorDashboardApi'
import { useGetAtyantSessionStatsQuery } from '@/store/api/atyantSessionsApi'
import { useGetLinkedinPostsQuery } from '@/store/api/linkedinApi'
import { useGetTasksQuery } from '@/store/api/tasksApi'
import { Spinner, Avatar, Badge } from '@/components/ui'
import { useCurrentUser } from '@/store/hooks'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

const PURPLE = '#7C3AED'

const SQUAD_META: Record<string, { label: string; color: string; emoji: string }> = {
  TECH:      { label: 'Tech',       color: '#2563EB', emoji: '💻' },
  OUTREACH:  { label: 'Outreach',   color: '#EA580C', emoji: '📡' },
  CONTENT:   { label: 'Content',    color: '#DB2777', emoji: '✍️' },
  PRODUCT:   { label: 'Product',    color: '#7C3AED', emoji: '🚀' },
  HR_DESIGN: { label: 'HR & Design', color: '#0891B2', emoji: '🎨' },
  CBM:       { label: 'CBM',        color: '#16A34A', emoji: '🤝' },
}
const squadMeta = (s?: string) => SQUAD_META[s ?? ''] ?? { label: s ?? '—', color: '#6B7280', emoji: '⭐' }

const MEDALS = ['🥇', '🥈', '🥉']

function ImpactCard({ label, value, icon, color, hint }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; hint?: string
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18', color }}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
        </div>
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-2">{hint}</p>}
    </div>
  )
}

function Section({ icon, title, subtitle, children, action }: {
  icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="mb-7">
      <div className="flex items-end justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const user = useCurrentUser()
  const { data: stats, isLoading: l1 } = useGetAtyantStatsQuery()
  const { data: sess, isLoading: l2 } = useGetAtyantSessionStatsQuery()
  const { data: posts = [] } = useGetLinkedinPostsQuery({ status: 'published' })
  const { data: tasks = [] } = useGetTasksQuery()

  // ── Gamification: people leaderboard (points from completed tasks) ──
  const leaders = useMemo(() => {
    const map = new Map<string, { name: string; squad?: string; points: number; done: number }>()
    tasks.forEach((t: Task) => {
      if (t.status !== 'DONE') return
      const id = t.assignedToId || t.assignedTo?.id || t.assignedTo?.name || 'unknown'
      const cur = map.get(id) ?? { name: t.assignedTo?.name ?? 'Teammate', squad: t.assignedTo?.squad ?? t.squad, points: 0, done: 0 }
      cur.points += t.points || 0
      cur.done += 1
      map.set(id, cur)
    })
    return [...map.values()].sort((a, b) => b.points - a.points).slice(0, 6)
  }, [tasks])

  // ── Squad standings ──
  const squads = useMemo(() => {
    const map = new Map<string, { points: number; done: number; active: number }>()
    tasks.forEach((t: Task) => {
      const cur = map.get(t.squad) ?? { points: 0, done: 0, active: 0 }
      if (t.status === 'DONE') { cur.points += t.points || 0; cur.done += 1 }
      if (t.status === 'IN_PROGRESS') cur.active += 1
      map.set(t.squad, cur)
    })
    return [...map.entries()]
      .map(([squad, v]) => ({ squad, ...v }))
      .sort((a, b) => b.points - a.points)
  }, [tasks])
  const topSquadPoints = squads[0]?.points || 1

  // ── What each squad is shipping right now ──
  const working = useMemo(() => tasks.filter((t: Task) => t.status === 'IN_PROGRESS').slice(0, 8), [tasks])

  // ── Social reach powered by the team ──
  const reach = useMemo(() => {
    const impressions = posts.reduce((a, p) => a + (p.impressions || 0), 0)
    const reactions = posts.reduce((a, p) => a + (p.reactions || 0), 0)
    return { impressions, reactions }
  }, [posts])
  const myRankData = useMemo(() => {
  if (!user) return null

  const allUsers = [...leaders]

  const rank =
    allUsers.findIndex(
      (p) => p.name === user.name
    ) + 1

  const me = allUsers.find(
    (p) => p.name === user.name
  )

  const myPoints = me?.points || 0

  const aboveUser =
    rank > 1
      ? allUsers[rank - 2]
      : null

  const nextRankGap =
    aboveUser
      ? aboveUser.points - myPoints
      : 0

  return {
    rank,
    myPoints,
    nextRankGap,
  }
}, [leaders, user])

const myTasks = tasks.filter(
  (t: Task) => t.assignedToId === user?.id
)

const completedTasks = myTasks.filter(
  (t: Task) => t.status === 'DONE'
).length

const progressPercent =
  myTasks.length > 0
    ? Math.round(
        (completedTasks / myTasks.length) * 100
      )
    : 0
  const totalCompletedTasks = tasks.filter(
  (t: Task) => t.status === 'DONE'
).length

const leadingSquad = squads[0]
const leadingSquadMeta = leadingSquad
  ? squadMeta(leadingSquad.squad)
  : null
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const loading = l1 || l2

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-6 text-white"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 55%, #2563EB 100%)' }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-16 bottom-0 w-52 h-52 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles size={14} /> Atyant Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Hey {firstName} 👋</h1>
          <p className="text-white/85 text-sm mt-1 max-w-xl">
            India&apos;s career execution intelligence platform — connecting students with seniors who&apos;ve
            already solved their exact problem, and turning every session into AI-trainable data.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-white/15 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold">
              {sess?.upcoming ?? '—'} sessions upcoming
            </span>
            <span className="bg-white/15 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold">
              {stats?.totalMentors ?? '—'} mentors onboard
            </span>
            <span className="bg-white/15 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold">
              {stats?.totalUsers ?? '—'} students reached
            </span>
          </div>
        </div>
      </div>

      {loading && <div className="flex justify-center py-10"><Spinner size={26} /></div>}
      {user?.role === 'INTERN' && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-7">
    <div className="card p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <p className="text-xs text-gray-500 font-semibold">🏆 My Rank</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">
        {myRankData?.rank ? `#${myRankData.rank}` : '—'}
      </p>
      <p className="text-[11px] text-gray-400 mt-1">
        ⭐ {myRankData?.myPoints ?? 0} points earned
      </p>
    </div>

    <div className="card p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <p className="text-xs text-gray-500 font-semibold">📈 My Progress</p>
      <div className="flex items-end justify-between mt-1">
        <p className="text-2xl font-bold text-gray-900">{progressPercent}%</p>
        <p className="text-[11px] text-gray-400">
          {completedTasks}/{myTasks.length} tasks
        </p>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mt-3">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #7C3AED, #2563EB)',
          }}
        />
      </div>
    </div>

    <div className="card p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <p className="text-xs text-gray-500 font-semibold">🎯 Next Rank</p>
      <p className="text-sm font-bold text-gray-900 mt-2">
        {myRankData?.rank === 1
          ? 'You are leading the board 👑'
          : myRankData?.nextRankGap
            ? `${myRankData.nextRankGap} pts to climb higher`
            : 'Complete tasks to enter ranking 🚀'}
      </p>
      <p className="text-[11px] text-gray-400 mt-1">
        Keep completing tasks to boost your score.
      </p>
    </div>
  </div>
)}
<div className="card p-5 mb-7 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300">
  <div className="flex items-center gap-3">
    <div className="text-2xl">🔥</div>

    <div>
      <p className="text-sm font-bold text-gray-900">
        Weekly Momentum
      </p>

      <p className="text-xs text-gray-500">
        {leadingSquad && leadingSquadMeta
          ? `${leadingSquadMeta.emoji} ${leadingSquadMeta.label} squad is leading with ${leadingSquad.points} points. ${totalCompletedTasks} tasks completed so far 🚀`
          : 'Complete tasks to build this week’s momentum 🚀'}
      </p>
    </div>
  </div>
</div>
      {/* ── Live impact ── */}
      <Section icon={<TrendingUp size={16} className="text-emerald-600" />} title="Live Impact"
        subtitle="Real numbers from the Atyant platform, right now">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <ImpactCard label="Mentors Onboard" value={stats?.totalMentors ?? '—'} icon={<Users size={18} />} color="#7C3AED"
            hint={`${stats?.activeMentors ?? 0} active this week`} />
          <ImpactCard label="Students Reached" value={stats?.totalUsers ?? '—'} icon={<GraduationCap size={18} />} color="#2563EB" />
          <ImpactCard label="Upcoming Sessions" value={sess?.upcoming ?? '—'} icon={<CalendarClock size={18} />} color="#EA580C"
            hint={`${sess?.thisWeek ?? 0} this week`} />
        </div>
      </Section>

      {/* ── This week ── */}
      <Section icon={<Flame size={16} className="text-orange-500" />} title="🔥 What's running this week"
        subtitle="The momentum we're carrying right now">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <CalendarClock size={20} className="text-blue-600" />
            <div><p className="text-xl font-bold text-gray-900">{sess?.thisWeek ?? '—'}</p><p className="text-xs text-gray-500">sessions booked this week</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <TrendingUp size={20} className="text-emerald-600" />
            <div><p className="text-xl font-bold text-gray-900">{stats?.activeMentors ?? '—'}</p><p className="text-xs text-gray-500">mentors active (7d)</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Wifi size={20} className="text-cyan-600" />
            <div><p className="text-xl font-bold text-gray-900">{stats?.onlineMentors ?? '—'}</p><p className="text-xs text-gray-500">mentors online now</p></div>
          </div>
        </div>
      </Section>

      {/* ── Amplify our posts ── */}
      <Section icon={<Megaphone size={16} className="text-pink-600" />} title="📣 Amplify our posts"
        subtitle="30 seconds from you = real reach. Like & comment to push these."
        action={reach.impressions > 0 ? (
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Eye size={13} /> {reach.impressions.toLocaleString('en-IN')} impressions</span>
            <span className="flex items-center gap-1"><Heart size={13} /> {reach.reactions.toLocaleString('en-IN')} reactions</span>
          </div>
        ) : undefined}>
        {posts.length === 0 ? (
          <div className="card p-6 text-center text-sm text-gray-500">
            No published posts yet. When the Content squad ships one, it shows up here for everyone to boost. ✍️
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {posts.slice(0, 4).map(p => (
              <div key={p.id} className="card p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge bgColor="#F5F3FF" textColor="#7C3AED" className="capitalize">{p.format}</Badge>
                  <span className="text-[11px] text-gray-400">{p.impressions?.toLocaleString('en-IN') ?? 0} views</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{p.title}</p>
                {(p.hook || p.body) && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.hook || p.body}</p>}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  {p.postUrl ? (
                    <>
                      <a href={p.postUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold py-2 hover:bg-blue-700 transition-colors">
                        <ThumbsUp size={13} /> Like on LinkedIn
                      </a>
                      <a href={p.postUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 text-gray-600 text-xs font-semibold py-2 px-3 hover:bg-gray-50 transition-colors">
                        <MessageCircle size={13} /> Comment
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">Link coming soon — ping the Content squad.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Leaderboard + Squad standings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
        {/* Top contributors */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-amber-500" />
            <div><h2 className="text-sm font-bold text-gray-900">🏆 Top Contributors</h2><p className="text-xs text-gray-500">Points from completed tasks</p></div>
          </div>
          <div className="card divide-y divide-gray-50">
            {leaders.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">No points on the board yet. Close a task to claim the #1 spot. 🚀</p>
            ) : leaders.map((p, i) => {
              const sm = squadMeta(p.squad)
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-6 text-center text-base">{MEDALS[i] ?? <span className="text-xs font-bold text-gray-400">#{i + 1}</span>}</span>
                  <Avatar name={p.name} size={32} bg={sm.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>

  {i === 0 && (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
      👑 Atyant Champion
    </span>
  )}

  {i === 1 && (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
      ⚡ Growth Accelerator
    </span>
  )}

  {i === 2 && (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
      🔥 Trailblazer
    </span>
  )}
</div>
                    <p className="text-[11px] text-gray-400">{sm.emoji} {sm.label} · {p.done} done</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: PURPLE }}>{p.points} pts</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Squad standings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-violet-500" />
            <div><h2 className="text-sm font-bold text-gray-900">⚔️ Squad Standings</h2><p className="text-xs text-gray-500">Which squad is leading the charge</p></div>
          </div>
          <div className="card p-4 space-y-3.5">
            {squads.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">Squad scores light up as tasks get completed.</p>
            ) : squads.map(s => {
              const sm = squadMeta(s.squad)
              return (
                <div key={s.squad}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{sm.emoji} {sm.label}</span>
                    <span className="text-gray-500">{s.points} pts · {s.active} active</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(4, (s.points / topSquadPoints) * 100)}%`, background: sm.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── What squads are shipping ── */}
      <Section icon={<Zap size={16} className="text-blue-500" />} title="⚡ Shipping right now"
        subtitle="What teammates are actively working on — cheer them on">
        {working.length === 0 ? (
          <div className="card p-6 text-center text-sm text-gray-500">Nothing in progress this moment. Pick up a task and put it here. 💪</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {working.map((t: Task) => {
              const sm = squadMeta(t.squad)
              return (
                <div key={t.id} className="card p-3.5 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: sm.color + '18' }}>{sm.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {sm.label}{t.assignedTo?.name ? ` · ${t.assignedTo.name}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sm.color + '18', color: sm.color }}>In progress</span>
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}
