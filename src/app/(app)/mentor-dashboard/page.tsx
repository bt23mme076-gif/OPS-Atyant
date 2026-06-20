'use client'
import { useMemo, useState } from 'react'
import {
  Users, TrendingUp, Wifi, BadgeCheck, Eye, Gauge, RefreshCw, Search,
  AlertTriangle, ChevronRight, ChevronLeft, Linkedin, CheckCircle2, XCircle, X,
  Video, Phone, MessageCircle, Briefcase, GraduationCap, Star, Clock,
  Building2, Mail,
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  useGetAtyantMentorsQuery, useGetAtyantStatsQuery,
  scoreProfile, completionPct, mentorName, isActive, mentorServices, serviceLabels,
  type RawMentor,
} from '@/store/api/mentorDashboardApi'
import { Spinner, Empty, Button, Avatar, Badge } from '@/components/ui'
import { useCurrentUser } from '@/store/hooks'
import { ROLES } from '@/lib/constants'
import { formatRelative, formatDate, cn } from '@/lib/utils'

const PURPLE = '#7C3AED'
const PALETTE = ['#7C3AED', '#2563EB', '#16A34A', '#EA580C', '#DB2777', '#0891B2', '#CA8A04', '#6B7280']

// ── Building blocks ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string
}) {
  return (
    <div className="card p-4 flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18', color }}>
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

function ChartCard({ title, children, className }: {
  title: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('card p-4', className)}>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{children}</p>
  )
}

function domainOf(m: RawMentor): string {
  const exp = m.expertise
  const expStr = Array.isArray(exp) ? String(exp[0] ?? '') : (typeof exp === 'string' ? exp : '')
  const d = m.primaryDomain || m.companyDomain || expStr
  return (d && String(d).trim()) ? String(d) : 'Unspecified'
}

function parseStrArr(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return (v as unknown[]).map(String).filter(s => s && s !== 'undefined')
  if (typeof v === 'string') {
    const t = v.trim()
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t) as unknown[]
        return parsed.map(String).filter(s => s && s !== 'undefined' && s !== 'null')
      } catch { /* fall through */ }
    }
    return t ? [t] : []
  }
  return []
}

function expertiseList(m: RawMentor): string[] {
  return parseStrArr(m.expertise)
}

// ── Comprehensive drill-down drawer ──────────────────────────────────────────
function MentorDrawer({ mentor, onClose }: { mentor: RawMentor; onClose: () => void }) {
  const fields = scoreProfile(mentor)
  const pct = completionPct(mentor)
  const svc = mentorServices(mentor)
  const svcLabels = serviceLabels(mentor)
  const expertise = expertiseList(mentor)

  // Skills: MongoDB sometimes stores as JSON string instead of array
  const skills = parseStrArr(mentor.skills as unknown)

  const topCompanies = parseStrArr(mentor.topCompanies)
  const milestones = (mentor.milestones as unknown[] | undefined) ?? []
  const education = mentor.education ?? []
  const weeklySlots = Array.isArray(mentor.availability?.weekly)
    ? (mentor.availability!.weekly as Record<string, unknown>[])
    : []
  const pctColor = pct >= 75 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626'

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full">

        {/* Sticky header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3 bg-white z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={mentorName(mentor)} size={50} bg={PURPLE} />
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-base leading-tight truncate">
                {mentorName(mentor)}
              </h2>
              {mentor.email && (
                <a href={`mailto:${mentor.email}`}
                  className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mt-0.5 truncate">
                  <Mail size={11} className="flex-shrink-0" />
                  {mentor.email}
                </a>
              )}
              {mentor.phone && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone size={11} className="flex-shrink-0" />
                  {mentor.phone}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Status badges */}
          <div className="px-5 pt-4 pb-3 flex flex-wrap gap-1.5 border-b border-gray-50">
            {mentor.isVerified
              ? <Badge bgColor="#F0FDF4" textColor="#15803D" color="#16A34A">✓ Verified</Badge>
              : <Badge bgColor="#FEF2F2" textColor="#B91C1C" color="#EF4444">✗ Not Verified</Badge>}
            {mentor.mentorListed
              ? <Badge bgColor="#F5F3FF" textColor="#7C3AED" color="#8B5CF6">Listed</Badge>
              : <Badge bgColor="#F9FAFB" textColor="#6B7280" color="#D1D5DB">Not Listed</Badge>}
            {isActive(mentor)
              ? <Badge bgColor="#EFF6FF" textColor="#1D4ED8" color="#3B82F6">Active (7d)</Badge>
              : <Badge bgColor="#F9FAFB" textColor="#6B7280" color="#D1D5DB">Inactive</Badge>}
            {mentor.isOnline && (
              <Badge bgColor="#ECFEFF" textColor="#0E7490" color="#06B6D4">● Online</Badge>
            )}
          </div>

          {/* Profile completion */}
          <div className="px-5 py-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Profile Completion</SectionLabel>
              <span className="text-sm font-bold" style={{ color: pctColor }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: pctColor }} />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {fields.map(f => (
                <div key={f.key} className="flex items-center gap-1.5">
                  {f.filled
                    ? <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                    : <XCircle size={12} className="text-red-400 flex-shrink-0" />}
                  <span className={cn('text-[11px]', f.filled ? 'text-gray-600' : 'text-gray-400')}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="px-5 py-4 border-b border-gray-50">
            <SectionLabel>Services Offered</SectionLabel>
            {/* TEMP DEBUG — remove once services format is confirmed */}
            <pre className="text-[9px] bg-gray-100 rounded p-1 mb-2 overflow-x-auto max-h-20 text-gray-500">
              {JSON.stringify({
                services: mentor.services,
                sessionTypes: mentor.sessionTypes,
                serviceTypes: mentor.serviceTypes,
                availWeekly: mentor.availability?.weekly,
              }, null, 1)}
            </pre>
            {svcLabels.length > 0 ? (
              // Show actual service names from the platform
              <div className="flex gap-2 flex-wrap">
                {svcLabels.map((label, i) => {
                  const l = label.toLowerCase()
                  const isVid = l.includes('video')
                  const isAud = l.includes('audio') || l.includes('voice')
                  const isCht = l.includes('chat') || l.includes('text') || l.includes('q&a') || l.includes('qa') || l.includes('message')
                  const isRes = l.includes('resume') || l.includes('review') || l.includes('written')
                  const colorClass = isVid
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : isAud
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : isCht
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : isRes
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                  return (
                    <div key={i} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium', colorClass)}>
                      {isVid && <Video size={13} />}
                      {isAud && <Phone size={13} />}
                      {isCht && <MessageCircle size={13} />}
                      {isRes && <Star size={13} />}
                      {label}
                    </div>
                  )
                })}
              </div>
            ) : (
              // Fall back to generic video/audio/chat detection
              <>
                <div className="flex gap-2 flex-wrap">
                  <div className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium',
                    svc.video ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-300 border-gray-100')}>
                    <Video size={13} /> Video Call
                  </div>
                  <div className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium',
                    svc.audio ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-300 border-gray-100')}>
                    <Phone size={13} /> Audio Call
                  </div>
                  <div className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium',
                    svc.chat ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-300 border-gray-100')}>
                    <MessageCircle size={13} /> Chat
                  </div>
                </div>
                {!svc.video && !svc.audio && !svc.chat && (
                  <p className="text-xs text-gray-400 italic mt-2">No services configured yet</p>
                )}
              </>
            )}
          </div>

          {/* Bio */}
          {mentor.bio && (
            <div className="px-5 py-4 border-b border-gray-50">
              <SectionLabel>Bio</SectionLabel>
              <p className="text-sm text-gray-600 leading-relaxed">{String(mentor.bio)}</p>
            </div>
          )}

          {/* Professional info */}
          <div className="px-5 py-4 border-b border-gray-50">
            <SectionLabel>Professional</SectionLabel>
            <div className="space-y-2">
              {(mentor.primaryDomain || mentor.companyDomain) && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-xs">Domain</span>
                  <span className="font-medium text-gray-700 ml-1">
                    {mentor.primaryDomain || mentor.companyDomain}
                  </span>
                </div>
              )}
              {!!mentor.yearsOfExperience && Number(mentor.yearsOfExperience) > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-xs">Experience</span>
                  <span className="font-medium text-gray-700 ml-1">
                    {mentor.yearsOfExperience} yr{Number(mentor.yearsOfExperience) !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {topCompanies.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Building2 size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 text-xs mt-0.5">Companies</span>
                  <span className="font-medium text-gray-700 ml-1">{topCompanies.join(', ')}</span>
                </div>
              )}
              {mentor.linkedinProfile && (
                <div className="flex items-center gap-2 text-sm">
                  <Linkedin size={13} className="text-blue-500 flex-shrink-0" />
                  <a href={mentor.linkedinProfile} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium text-xs">
                    View LinkedIn Profile ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Expertise & Skills */}
          {(expertise.length > 0 || skills.length > 0) && (
            <div className="px-5 py-4 border-b border-gray-50 space-y-3">
              {expertise.length > 0 && (
                <div>
                  <SectionLabel>Expertise</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {expertise.map((e, i) => (
                      <span key={i}
                        className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[11px] font-medium">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skills.length > 0 && (
                <div>
                  <SectionLabel>Skills</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, i) => (
                      <span key={i}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-50">
              <SectionLabel>Education</SectionLabel>
              <div className="space-y-3">
                {education.map((e, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <GraduationCap size={13} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {e.institutionName || e.institution || '—'}
                      </p>
                      {(e.degree || e.field) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[e.degree, e.field].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <div className="flex gap-3 mt-0.5 text-[11px] text-gray-400">
                        {e.year && <span>{e.year}</span>}
                        {e.cgpa && <span>CGPA: {e.cgpa}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {milestones.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-50">
              <SectionLabel>Achievements</SectionLabel>
              <div className="space-y-2">
                {milestones.map((m, i) => {
                  let text = ''
                  if (typeof m === 'string') {
                    text = m
                  } else if (m && typeof m === 'object') {
                    const o = m as Record<string, unknown>
                    text = String(o.title ?? o.name ?? o.description ?? o.text ?? o.milestone ?? Object.values(o).find(v => typeof v === 'string') ?? '')
                  }
                  if (!text) return null
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <Star size={12} className="text-amber-400 flex-shrink-0 mt-1" />
                      <span className="text-sm text-gray-600">{text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Availability */}
          {mentor.availability != null && (
            <div className="px-5 py-4 border-b border-gray-50">
              <SectionLabel>
                Availability
                {weeklySlots.length > 0 && (
                  <span className="ml-1 normal-case font-normal text-gray-400">
                    ({weeklySlots.length} slot{weeklySlots.length !== 1 ? 's' : ''})
                  </span>
                )}
              </SectionLabel>
              {weeklySlots.length > 0 ? (
                <div className="space-y-1.5">
                  {weeklySlots.map((slot, i) => {
                    const dayRaw = slot.day ?? slot.dayOfWeek ?? slot.weekday
                    const day = dayRaw != null ? String(dayRaw) : '—'
                    const timeRaw = slot.time ?? slot.startTime ?? slot.from
                    const endRaw = slot.endTime ?? slot.to
                    const time = timeRaw != null ? String(timeRaw) : ''
                    const endTime = endRaw != null ? String(endRaw) : ''
                    const sTypeRaw = slot.serviceType ?? slot.type ?? slot.service ?? slot.sessionType
                    const sType = sTypeRaw != null ? String(sTypeRaw).toLowerCase() : ''
                    const timeStr = time && endTime ? `${time} – ${endTime}` : time
                    return (
                      <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-700 font-medium capitalize">{day}</span>
                        <div className="flex items-center gap-2">
                          {timeStr && <span className="text-gray-400">{timeStr}</span>}
                          {sType && (
                            <span className={cn(
                              'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                              sType.includes('video')
                                ? 'bg-purple-50 text-purple-700'
                                : sType.includes('audio') || sType.includes('voice')
                                  ? 'bg-blue-50 text-blue-700'
                                  : sType.includes('chat') || sType.includes('text')
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                            )}>
                              {sType.includes('video') && <Video size={9} />}
                              {(sType.includes('audio') || sType.includes('voice')) && <Phone size={9} />}
                              {(sType.includes('chat') || sType.includes('text')) && <MessageCircle size={9} />}
                              {sType}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Availability configured but no weekly slots found</p>
              )}
            </div>
          )}

          {/* Account info */}
          <div className="px-5 py-4">
            <SectionLabel>Account Info</SectionLabel>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last active</span>
                <span className="text-gray-700 font-medium">
                  {mentor.lastActive ? formatRelative(mentor.lastActive) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Joined</span>
                <span className="text-gray-700 font-medium">
                  {mentor.createdAt ? formatDate(mentor.createdAt) : '—'}
                </span>
              </div>
              {mentor.profileStrength != null && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Profile Strength</span>
                  <span className="text-gray-700 font-medium">{mentor.profileStrength}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                <span className="text-gray-400">Mentor ID</span>
                <span className="text-gray-400 font-mono text-[10px] truncate max-w-[180px]">{mentor._id}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
type SortKey = 'name' | 'completion' | 'lastActive'
const PAGE_SIZE = 20

export default function MentorDashboardPage() {
  const user = useCurrentUser()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const { data: mentors = [], isLoading, isError, refetch, isFetching } =
    useGetAtyantMentorsQuery(undefined, { skip: !isSuperAdmin })
  const { data: stats } =
    useGetAtyantStatsQuery(undefined, { skip: !isSuperAdmin })

  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'verified' | 'listed' | 'incomplete'
  >('all')
  const [sortKey, setSortKey] = useState<SortKey>('completion')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<RawMentor | undefined>()

  // ── Analytics ──
  const analytics = useMemo(() => {
    const total = mentors.length
    const active = mentors.filter(m => isActive(m)).length
    const online = mentors.filter(m => m.isOnline).length
    const verified = mentors.filter(m => m.isVerified).length
    const listed = mentors.filter(m => m.mentorListed).length
    const pcts = mentors.map(completionPct)
    const avgCompletion = total
      ? Math.round(pcts.reduce((a, b) => a + b, 0) / total)
      : 0

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

    const domMap = new Map<string, number>()
    mentors.forEach(m => {
      const d = domainOf(m)
      domMap.set(d, (domMap.get(d) ?? 0) + 1)
    })
    const domSorted = [...domMap.entries()].sort((a, b) => b[1] - a[1])
    const domains = domSorted.slice(0, 7).map(([name, value]) => ({ name, value }))
    const otherTotal = domSorted.slice(7).reduce((a, [, v]) => a + v, 0)
    if (otherTotal) domains.push({ name: 'Other', value: otherTotal })

    const activeVsInactive = [
      { name: 'Active (7d)', value: active },
      { name: 'Inactive', value: total - active },
    ]

    const now = new Date()
    const months: { name: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ name: d.toLocaleString('en', { month: 'short' }), count: 0 })
    }
    mentors.forEach(m => {
      if (!m.createdAt) return
      const c = new Date(m.createdAt)
      const idx =
        (now.getFullYear() - c.getFullYear()) * 12 + (now.getMonth() - c.getMonth())
      if (idx >= 0 && idx <= 5) months[5 - idx].count++
    })

    const alerts = {
      incomplete: mentors.filter(m => completionPct(m) < 50).length,
      notListed: mentors.filter(m => !m.mentorListed).length,
      stale: mentors.filter(m => !isActive(m, 30)).length,
      unverified: mentors.filter(m => !m.isVerified).length,
    }

    const domainOptions = domSorted.map(([d]) => d)

    return {
      total, active, online, verified, listed, avgCompletion,
      buckets, domains, activeVsInactive, months, alerts, domainOptions,
    }
  }, [mentors])

  // ── Filtering / sorting / pagination ──
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
        return (
          mentorName(m).toLowerCase().includes(s) ||
          (m.email ?? '').toLowerCase().includes(s) ||
          domainOf(m).toLowerCase().includes(s)
        )
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

  // ── Guards ──
  if (!isSuperAdmin) return (
    <div className="card p-10 text-center">
      <AlertTriangle className="mx-auto text-amber-500 mb-3" size={28} />
      <p className="text-gray-700 font-medium text-sm">Restricted</p>
      <p className="text-gray-400 text-xs mt-1">
        The Mentor Dashboard is available to Super Admins only.
      </p>
    </div>
  )

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={28} />
    </div>
  )

  if (isError) return (
    <div className="card p-8 text-center">
      <AlertTriangle className="mx-auto text-amber-500 mb-3" size={28} />
      <p className="text-gray-700 font-medium text-sm">Could not load mentor data</p>
      <p className="text-gray-400 text-xs mt-1">
        The <code className="bg-gray-100 px-1 rounded">/atyant/mentors</code> endpoint did not respond.
        Check that the backend is running.
      </p>
      <Button variant="primary" size="sm" className="mt-4" onClick={() => refetch()}>
        Retry
      </Button>
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="Total Mentors"
          value={stats?.totalMentors ?? analytics.total}
          icon={<Users size={18} />}
          color="#7C3AED"
        />
        <StatCard
          label="Active (7d)"
          value={analytics.active}
          icon={<TrendingUp size={18} />}
          color="#16A34A"
        />
        <StatCard
          label="Online Now"
          value={stats?.onlineMentors ?? analytics.online}
          icon={<Wifi size={18} />}
          color="#0891B2"
        />
        <StatCard
          label="Verified"
          value={analytics.verified}
          icon={<BadgeCheck size={18} />}
          color="#2563EB"
        />
        <StatCard
          label="Listed"
          value={analytics.listed}
          icon={<Eye size={18} />}
          color="#DB2777"
        />
        <StatCard
          label="Avg Complete"
          value={`${analytics.avgCompletion}%`}
          icon={<Gauge size={18} />}
          color="#EA580C"
        />
      </div>

      {/* Alert cards — clickable filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Incomplete profiles (<50%)', value: analytics.alerts.incomplete, color: '#DC2626', filter: 'incomplete' as const },
          { label: 'Not listed publicly', value: analytics.alerts.notListed, color: '#D97706', filter: 'listed' as const },
          { label: 'Inactive >30 days', value: analytics.alerts.stale, color: '#6B7280', filter: 'inactive' as const },
          { label: 'Pending verification', value: analytics.alerts.unverified, color: '#7C3AED', filter: 'verified' as const },
        ].map(a => (
          <button
            key={a.label}
            onClick={() => { setStatusFilter(a.filter); setPage(0) }}
            className="card card-hover p-4 text-left"
          >
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
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={analytics.activeVsInactive}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={76}
                paddingAngle={2}
              >
                <Cell fill="#16A34A" />
                <Cell fill="#E2E8F0" />
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-gray-600 mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Active {analytics.active}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Inactive {analytics.total - analytics.active}
            </span>
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
          <input
            className="input pl-8 text-sm"
            placeholder="Search name, email, domain…"
            value={search}
            onChange={e => resetPage(setSearch)(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-44 text-sm"
          value={domainFilter}
          onChange={e => resetPage(setDomainFilter)(e.target.value)}
        >
          <option value="all">All Domains</option>
          {analytics.domainOptions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          className="input sm:w-44 text-sm"
          value={statusFilter}
          onChange={e => resetPage((v: typeof statusFilter) => setStatusFilter(v))(e.target.value as typeof statusFilter)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active (7d)</option>
          <option value="inactive">Inactive</option>
          <option value="verified">Verified</option>
          <option value="listed">Listed</option>
          <option value="incomplete">Incomplete (&lt;50%)</option>
        </select>
        <select
          className="input sm:w-44 text-sm"
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
        >
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Mentor', 'Domain', 'Completion', 'Status', 'Services', 'Last Active', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((m, i) => {
                    const pct = completionPct(m)
                    const svc = mentorServices(m)
                    return (
                      <tr
                        key={m._id}
                        onClick={() => setSelected(m)}
                        className={cn(
                          'border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors',
                          i === pageRows.length - 1 && 'border-0'
                        )}
                      >
                        {/* Mentor */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={mentorName(m)} size={30} bg={PURPLE} />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {mentorName(m)}
                              </p>
                              {m.email && (
                                <p className="text-xs text-gray-400 truncate">{m.email}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Domain */}
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px] truncate">
                          {domainOf(m)}
                        </td>

                        {/* Completion */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: pct >= 75 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626',
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 tabular-nums w-8">{pct}%</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {m.isVerified && (
                              <Badge bgColor="#EFF6FF" textColor="#1D4ED8" color="#3B82F6">Verified</Badge>
                            )}
                            {m.mentorListed && (
                              <Badge bgColor="#F5F3FF" textColor="#7C3AED" color="#8B5CF6">Listed</Badge>
                            )}
                            {isActive(m)
                              ? <Badge bgColor="#F0FDF4" textColor="#15803D" color="#16A34A">Active</Badge>
                              : <Badge bgColor="#F9FAFB" textColor="#6B7280" color="#9CA3AF">Inactive</Badge>
                            }
                          </div>
                        </td>

                        {/* Services */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span title="Video Call" className={svc.video ? 'text-purple-600' : 'text-gray-200'}>
                              <Video size={13} />
                            </span>
                            <span title="Audio Call" className={svc.audio ? 'text-blue-500' : 'text-gray-200'}>
                              <Phone size={13} />
                            </span>
                            <span title="Chat" className={svc.chat ? 'text-green-500' : 'text-gray-200'}>
                              <MessageCircle size={13} />
                            </span>
                          </div>
                        </td>

                        {/* Last active */}
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {m.lastActive ? formatRelative(m.lastActive) : '—'}
                        </td>

                        <td className="px-4 py-3">
                          <ChevronRight size={14} className="text-gray-300" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>
              Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                disabled={safePage === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="px-2">Page {safePage + 1} / {pageCount}</span>
              <Button
                variant="ghost"
                size="xs"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}

      {selected && (
        <MentorDrawer mentor={selected} onClose={() => setSelected(undefined)} />
      )}
    </div>
  )
}
