"use client"

import { useMemo, useState } from "react"
import React from "react"
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
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <h2 className="mt-2 text-3xl font-bold" style={{ color: accent ?? "#111827" }}>
        {value}
      </h2>
    </div>
  )
}

/* ─── Streak Card ─── */
function computeStreak(posts: LinkedinPost[]): { current: number; longest: number; postedToday: boolean } {
  // Only count days that have at least one "published" post
  const publishedDates = new Set(
    posts
      .filter((p) => p.status === "published" && (p.publishedAt ?? p.scheduledFor))
      .map((p) => {
        const d = new Date(p.publishedAt ?? p.scheduledFor ?? "")
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
  )

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const postedToday = publishedDates.has(todayKey)

  // Walk backwards from today counting consecutive days with a post
  let current = 0
  const cursor = new Date(today)
  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`
    if (!publishedDates.has(key)) break
    current++
    cursor.setDate(cursor.getDate() - 1)
  }

  // Longest streak: scan all dates in sorted order
  const sortedDays = Array.from(publishedDates)
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number)
      return new Date(y, m, d).getTime()
    })
    .sort((a, b) => a - b)

  let longest = current
  let run = sortedDays.length > 0 ? 1 : 0
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = (sortedDays[i] - sortedDays[i - 1]) / 86400000
    if (diff === 1) {
      run++
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }

  return { current, longest, postedToday }
}

function StreakCard({ posts }: { posts: LinkedinPost[] }) {
  const { current, longest, postedToday } = computeStreak(posts)
  const atRisk = !postedToday && current > 0

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase text-gray-400">🔥 Streak</p>
      <div className="mt-2 flex items-end gap-2">
        <h2 className="text-3xl font-bold text-orange-500">
          {current} {current === 1 ? "Day" : "Days"}
        </h2>
        <span className="mb-1 text-xs text-gray-400">Longest: {longest}</span>
      </div>
      {postedToday ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-green-600">You&apos;re on fire!</span>
        </div>
      ) : atRisk ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-orange-500">⚠ Streak breaks tomorrow</span>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-400">Post today to start a streak!</span>
        </div>
      )}
    </div>
  )
}

/* ─── Daily Nudge Card ─── */
const TIPS = [
  { emoji: "✍️", tip: "Share a lesson you learned this week — authenticity drives engagement." },
  { emoji: "🎯", tip: "A good hook decides everything. Write 3 versions of your opening line." },
  { emoji: "💡", tip: "Carousels get 3× more reach than plain text posts. Try one today." },
  { emoji: "🔁", tip: "Repurpose your best-performing post into a new format." },
  { emoji: "📊", tip: "Post a poll — it's the easiest way to spark comments." },
  { emoji: "🌅", tip: "8–10 AM posts get the most impressions. Schedule for the morning." },
  { emoji: "🤝", tip: "Comment on 3 posts in your niche before publishing yours." },
]

function DailyNudgeCard({ onPost }: { onPost: () => void }) {
  const tip = TIPS[new Date().getDay() % TIPS.length]
  return (
    <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-200 to-indigo-300 p-6 shadow-lg">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-32 w-32 rounded-full bg-indigo-200/40 blur-2xl" />

      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-500">💡 Today&apos;s Tip</p>
        <div className="mt-5 flex flex-col items-start gap-3">
          <span className="text-6xl leading-none">{tip.emoji}</span>
          <p className="text-lg font-semibold leading-snug text-gray-700">
            {tip.tip}
          </p>
        </div>
      </div>

      <button
        onClick={onPost}
        className="relative mt-6 w-full rounded-xl bg-blue-600 py-3 text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-95"
      >
        ✦ Create a Post
      </button>
    </div>
  )
}
function WeeklyGoalCard({ postedThisWeek, weeklyTarget }: { postedThisWeek: number; weeklyTarget: number }) {
  const pct = weeklyTarget > 0 ? Math.min((postedThisWeek / weeklyTarget) * 100, 100) : 0
  const done = postedThisWeek >= weeklyTarget
  const behind = postedThisWeek === 0
  const almostThere = pct >= 66 && !done

  const barColor = done ? "bg-green-500" : behind ? "bg-red-400" : "bg-orange-400"
  const textColor = done ? "text-green-600" : behind ? "text-red-500" : "text-orange-500"
  const msg = done
    ? "🔥 Amazing consistency!"
    : almostThere
    ? "Almost there!"
    : postedThisWeek > 0
    ? "Keep going!"
    : `Behind by ${weeklyTarget - postedThisWeek} posts`

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase text-gray-400">🎯 Weekly Goal</p>
      <div className="mt-2 flex items-end gap-2">
        <h2 className={`text-3xl font-bold ${textColor}`}>
          {postedThisWeek} / {weeklyTarget}
        </h2>
        <span className="mb-1 text-xs text-gray-400">Posts</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`mt-2 text-xs font-semibold ${textColor}`}>{msg}</p>
    </div>
  )
}

/* ─── Achievements ─── */
type Badge = {
  icon: string
  title: string
  pct: number          // 0–100
  color: {
    ring: string       // stroke color (CSS color)
    glow: string       // box-shadow glow color
    bg: string         // card background
    border: string     // card border
    text: string       // title text color
  }
}

const BADGES: Badge[] = [
  {
    icon: "🔥",
    title: "Consistency",
    pct: 0,
    color: {
      ring: "#F97316",
      glow: "rgba(249,115,22,0.3)",
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-600",
    },
  },
  {
    icon: "🚀",
    title: "Viral",
    pct: 0,
    color: {
      ring: "#3B82F6",
      glow: "rgba(59,130,246,0.3)",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
    },
  },
  {
    icon: "🎯",
    title: "Lead",
    pct: 0,
    color: {
      ring: "#8B5CF6",
      glow: "rgba(139,92,246,0.3)",
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-600",
    },
  },
  {
    icon: "🌟",
    title: "Growth",
    pct: 0,
    color: {
      ring: "#22C55E",
      glow: "rgba(34,197,94,0.3)",
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-600",
    },
  },
]

/* Circular SVG ring that animates on mount */
function CircleRing({
  pct,
  color,
  icon,
  locked,
  size = 96,
  stroke = 7,
}: {
  pct: number
  color: string
  icon: string
  locked: boolean
  size?: number
  stroke?: number
}) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Track — faint ring in badge color so locked state still has identity */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeOpacity={locked ? 0.18 : 0.15}
        />
        {/* Progress arc */}
        {pct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
          />
        )}
      </svg>

      {/* Center: icon + lock overlay */}
      <div className="relative flex flex-col items-center justify-center">
        {/* The badge emoji, desaturated when locked via CSS filter */}
        <span
          className="text-3xl leading-none select-none"
          style={locked ? { filter: "grayscale(1) opacity(0.45)" } : undefined}
        >
          {icon}
        </span>
        {/* Small lock badge pinned bottom-right of the ring */}
        {locked && (
          <span
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] shadow-sm"
          >
            🔒
          </span>
        )}
      </div>
    </div>
  )
}

function AchievementsSection() {
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  if (!mounted) {
    setTimeout(() => setReady(true), 50)
    setMounted(true)
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">🏅 Achievements</p>
        <span className="text-[11px] text-gray-400">Post consistently to unlock</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {BADGES.map((b) => {
          const locked = b.pct === 0
          return (
            <div
              key={b.title}
              className={`group relative flex flex-col items-center rounded-2xl border px-4 py-6 text-center cursor-default
                ${locked
                  ? `${b.color.bg} ${b.color.border}`
                  : `${b.color.bg} ${b.color.border} shadow-sm`
                }`}
              style={{
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                opacity: locked ? 0.72 : 1,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = "translateY(-4px)"
                el.style.boxShadow = `0 8px 24px ${b.color.glow}`
                el.style.opacity = "1"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = ""
                el.style.boxShadow = ""
                el.style.opacity = locked ? "0.72" : "1"
              }}
            >
              {/* Circular ring */}
              <div className="transition-transform duration-200 group-hover:scale-105">
                <CircleRing
                  pct={ready ? b.pct : 0}
                  color={b.color.ring}
                  icon={b.icon}
                  locked={locked}
                  size={88}
                  stroke={7}
                />
              </div>

              {/* Percentage */}
              <p className={`mt-3 text-xl font-bold tabular-nums ${locked ? "text-gray-400" : b.color.text}`}>
                {b.pct}%
              </p>

              {/* Title */}
              <p className={`mt-1 text-xs font-semibold tracking-wide ${locked ? "text-gray-500" : "text-gray-700"}`}>
                {b.title}
              </p>

              {/* Locked pill */}
              {locked && (
                <span className="mt-2 rounded-full bg-white/70 border border-gray-200 px-2.5 py-0.5 text-[10px] font-medium text-gray-400">
                  Locked
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Content Calendar ─── */
const FORMAT_ICON: Record<string, string> = {
  text: "📝",
  carousel: "📄",
  document: "📄",
  video: "🎥",
  poll: "📊",
  image: "🖼️",
  repost: "🔁",
}

const CALENDAR_STATUS_STYLE: Record<string, { dot: string; bg: string; text: string }> = {
  published: { dot: "bg-green-500", bg: "bg-green-50", text: "text-green-700" },
  scheduled: { dot: "bg-yellow-400", bg: "bg-yellow-50", text: "text-yellow-700" },
  draft: { dot: "bg-blue-400", bg: "bg-blue-50", text: "text-blue-700" },
  idea: { dot: "bg-purple-400", bg: "bg-purple-50", text: "text-purple-700" },
  archived: { dot: "bg-red-400", bg: "bg-red-50", text: "text-red-600" },
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

type HoverPost = { post: LinkedinPost; x: number; y: number }

function ContentCalendar({
  posts,
  onCreatePost,
}: {
  posts: LinkedinPost[]
  onCreatePost: () => void
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [hovered, setHovered] = useState<HoverPost | null>(null)

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const postsByDay = useMemo(() => {
    const map: Record<number, LinkedinPost[]> = {}
    posts.forEach((p) => {
      if (!p.scheduledFor && !p.publishedAt) return
      const dateStr = p.publishedAt ?? p.scheduledFor
      if (!dateStr) return
      const d = new Date(dateStr)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(p)
      }
    })
    return map
  }, [posts, year, month])

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">📅 Content Calendar</p>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="rounded-lg border px-3 py-1 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            ‹
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-gray-700">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth}
            className="rounded-lg border px-3 py-1 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase text-gray-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          const isToday = day !== null && day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const dayPosts = day ? (postsByDay[day] ?? []) : []
          return (
            <div
              key={i}
              onClick={() => day && onCreatePost()}
              className={`min-h-[72px] rounded-xl p-1.5 transition-all duration-150 ${
                day ? "cursor-pointer hover:bg-blue-50 hover:shadow-sm" : ""
              } ${isToday ? "ring-2 ring-blue-500 ring-offset-1" : "border border-gray-50"}`}
            >
              {day && (
                <>
                  <span className={`text-xs font-semibold ${isToday ? "text-blue-600" : "text-gray-500"}`}>
                    {day}
                  </span>
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {dayPosts.slice(0, 2).map((p) => {
                      const st = CALENDAR_STATUS_STYLE[p.status] ?? CALENDAR_STATUS_STYLE.draft
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium ${st.bg} ${st.text} cursor-pointer`}
                          onMouseEnter={(e) => setHovered({ post: p, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHovered(null)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{FORMAT_ICON[p.format] ?? "📝"}</span>
                          <span className="truncate max-w-[60px]">{p.title}</span>
                        </div>
                      )
                    })}
                    {dayPosts.length > 2 && (
                      <span className="text-[10px] text-gray-400 pl-1">+{dayPosts.length - 2} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {[
          { label: "Published", cls: "bg-green-500" },
          { label: "Scheduled", cls: "bg-yellow-400" },
          { label: "Draft", cls: "bg-blue-400" },
          { label: "Missed/Archived", cls: "bg-red-400" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${l.cls}`} />
            <span className="text-[11px] text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>

      {hovered && (
        <div
          className="fixed z-50 rounded-xl border bg-white p-3 shadow-xl text-xs"
          style={{ top: hovered.y + 12, left: hovered.x + 8, minWidth: 180 }}
        >
          <p className="font-semibold text-gray-800">{hovered.post.title}</p>
          <p className="mt-1 text-gray-500 capitalize">{hovered.post.status}</p>
          {(hovered.post.publishedAt ?? hovered.post.scheduledFor) && (
            <p className="text-gray-400">
              {new Date(hovered.post.publishedAt ?? hovered.post.scheduledFor ?? "").toLocaleDateString()}
            </p>
          )}
          <p className="mt-1 font-medium text-purple-600">{hovered.post.engagementRate ?? 0}% engagement</p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════ MAIN PAGE ════════════════════════════ */

export default function LinkedinPage() {
  const [tab, setTab] = useState<"posts" | "leads">("posts")
  const [showCreatePost, setShowCreatePost] = useState(false)
  const postsSectionRef = React.useRef<HTMLDivElement>(null)

  const scrollToPostForm = () => {
    setTab("posts")
    setShowCreatePost(true)
    setTimeout(() => {
      postsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }

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
      </div>

      {/* ─── Row 1: Main stats ─── */}
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

          {/* ─── Row 2: Streak + Weekly Goal (left col) + Achievements (right col) ─── */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left: Streak on top, Weekly Goal below, Daily Nudge fills remaining space */}
            <div className="flex flex-col gap-4">
              <StreakCard posts={posts} />
              <WeeklyGoalCard
                postedThisWeek={stats.cadence.postedThisWeek}
                weeklyTarget={stats.cadence.weeklyTarget}
              />
              <DailyNudgeCard onPost={scrollToPostForm} />
            </div>
            {/* Right: Achievements */}
            <AchievementsSection />
          </div>

          {/* ─── Row 3: Content Calendar ─── */}
          <ContentCalendar posts={posts} onCreatePost={() => setShowCreatePost(true)} />

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

      {/* ─── Row 4: Tabs + Tables ─── */}
      <div ref={postsSectionRef} className="flex gap-2 border-b">
        {(["posts", "leads"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
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
        <PostsTab
          posts={posts}
          users={users}
          userName={userName}
          showFormInitial={showCreatePost}
          onFormClosed={() => setShowCreatePost(false)}
        />
      ) : (
        <LeadsTab leads={leads} posts={posts} users={users} userName={userName} postTitle={postTitle} />
      )}
    </div>
  )
}

/* ════════════════════════════ POSTS TAB ════════════════════════════ */

function PostsTab({
  posts,
  users,
  userName,
  showFormInitial,
  onFormClosed,
}: {
  posts: LinkedinPost[]
  users: { id: string; name: string }[]
  userName: (id?: string | null) => string
  showFormInitial?: boolean
  onFormClosed?: () => void
}) {
  const [createPost] = useCreateLinkedinPostMutation()
  const [updatePost] = useUpdateLinkedinPostMutation()
  const [deletePost] = useDeleteLinkedinPostMutation()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [showForm, setShowForm] = useState(showFormInitial ?? false)
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
      onFormClosed?.()
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
          onClick={() => { setShowForm((v) => !v); if (showForm) onFormClosed?.() }}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
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
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
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
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{p.title}</div>
                      {p.topic && <div className="text-xs text-gray-400">{p.topic}</div>}
                      {p.postUrl && (
                        <a href={p.postUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                          View on LinkedIn ↗
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {FORMAT_ICON[p.format] ?? "📝"} {titleCase(p.format)}
                    </td>
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
                          className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors">
                          Metrics
                        </button>
                        <button onClick={() => remove(p.id)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
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
          <div className="p-10 text-center">
            <p className="text-4xl">✍️</p>
            <p className="mt-3 text-sm font-medium text-gray-500">No posts yet</p>
            <p className="text-xs text-gray-400 mt-1">Add your first post to start tracking.</p>
          </div>
        )}
      </div>

      {metricsFor && (
        <MetricsModal post={metricsFor} onClose={() => setMetricsFor(null)} onSaved={() => setMetricsFor(null)} />
      )}
    </div>
  )
}

/* ─── Metrics Modal ─── */
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
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            Save
          </button>
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════ LEADS TAB ════════════════════════════ */

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
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
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
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
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
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
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
                            className="rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors">
                            Convert
                          </button>
                        )}
                        <button onClick={() => remove(l.id)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
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
          <div className="p-10 text-center">
            <p className="text-4xl">🤝</p>
            <p className="mt-3 text-sm font-medium text-gray-500">No leads yet</p>
            <p className="text-xs text-gray-400 mt-1">Add people who engaged with your posts.</p>
          </div>
        )}
      </div>
    </div>
  )
}
