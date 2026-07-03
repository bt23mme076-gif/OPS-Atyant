import { baseApi } from './baseApi'

export interface RawEducation {
  institutionName?: string
  institution?: string
  degree?: string
  field?: string
  year?: string | number
  cgpa?: string | number
}

export interface RawWeeklySlot {
  day?: number        // 0=Sun, 1=Mon … 6=Sat
  slots?: string[]    // ["08:00", "09:00"]
  _id?: string
}

export interface RawMentor {
  _id: string
  name?: string
  username?: string   // Atyant stores display name here
  fullName?: string
  email?: string
  phone?: string
  role?: string
  profilePicture?: string
  bio?: string
  education?: RawEducation[]
  skills?: unknown
  expertise?: unknown
  linkedinProfile?: string
  topCompanies?: unknown
  companyDomain?: string
  primaryDomain?: string
  price?: number
  servicesOffered?: string[]   // PRIMARY field: ["text-qa","audio-call","video-call"]
  services?: unknown           // legacy / fallback
  sessionTypes?: unknown       // legacy / fallback
  serviceTypes?: unknown       // legacy / fallback
  yearsOfExperience?: number
  milestones?: unknown[]
  availability?: {
    weekly?: RawWeeklySlot[]
    timezone?: string
    advanceNoticeHours?: number
    maxWeeksAhead?: number
  } | null
  city?: string
  specialTags?: string[]
  isVerified?: boolean
  mentorListed?: boolean
  isOnline?: boolean
  lastActive?: string
  lastLogin?: string
  createdAt?: string
  updatedAt?: string
  profileStrength?: number
  [key: string]: unknown
}

export interface AtyantStats {
  totalMentors: number
  activeMentors: number
  totalUsers: number
  onlineMentors: number
}

export interface ProfileField {
  key: string
  label: string
  filled: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nonEmpty(v: unknown): boolean {
  if (v == null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t || t === '[]' || t === '{}') return false
    if (t.startsWith('[')) {
      try { return (JSON.parse(t) as unknown[]).length > 0 } catch { /* fall */ }
    }
    return true
  }
  if (typeof v === 'number') return v > 0
  if (typeof v === 'object') return Object.keys(v as object).length > 0
  return Boolean(v)
}

function extractStrings(v: unknown): string[] {
  if (!v) return []
  if (typeof v === 'string') {
    const t = v.trim()
    if (t.startsWith('[')) {
      try { return extractStrings(JSON.parse(t)) } catch { /* fall */ }
    }
    return t ? [t] : []
  }
  if (Array.isArray(v)) {
    return v.flatMap(item => {
      if (typeof item === 'string') return [item]
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        if (o.enabled === false || o.active === false || o.isEnabled === false) return []
        const typeVal = o.type ?? o.name ?? o.id ?? o.slug ?? o.serviceType ?? o.service
        if (typeVal && typeof typeVal === 'string') return [typeVal]
        return Object.values(o).filter((x): x is string => typeof x === 'string')
      }
      return []
    })
  }
  if (typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>)
      .filter(([, val]) => {
        if (typeof val === 'boolean') return val
        if (val && typeof val === 'object') return (val as Record<string, unknown>).enabled !== false
        return Boolean(val)
      })
      .map(([key]) => key)
  }
  return []
}

// ── Services ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export function dayName(n: number): string {
  return DAY_NAMES[n] ?? String(n)
}

// Maps raw service slugs to display labels
export function serviceDisplayName(slug: string): string {
  const map: Record<string, string> = {
    'text-qa': 'Text Q&A',
    'textqa': 'Text Q&A',
    'text_qa': 'Text Q&A',
    'audio-call': 'Audio Call',
    'audio_call': 'Audio Call',
    'audio': 'Audio Call',
    'video-call': 'Video Call',
    'video_call': 'Video Call',
    'video': 'Video Call',
    'chat': 'Chat',
    'message': 'Chat',
    'resume-review': 'Resume Review',
    'resume_review': 'Resume Review',
  }
  return map[slug.toLowerCase()] ?? slug
}

export function mentorServices(m: RawMentor): { video: boolean; audio: boolean; chat: boolean } {
  // servicesOffered is the primary field in Atyant's MongoDB
  const primary = m.servicesOffered ?? []
  const fallback = [
    ...extractStrings(m.services),
    ...extractStrings(m.sessionTypes),
    ...extractStrings(m.serviceTypes),
  ]
  const all = [...primary, ...fallback].map(s => s.toLowerCase().replace(/[\s_]/g, '-').trim())

  const has = (kws: string[]) => all.some(s => kws.some(k => s.includes(k)))

  return {
    video: has(['video']),
    audio: has(['audio', 'voice']),
    chat:  has(['chat', 'text', 'message', 'q&a', 'qa']),
  }
}

export function serviceLabels(m: RawMentor): string[] {
  const raw = m.servicesOffered ?? extractStrings(m.services)
  return raw.map(serviceDisplayName)
}

// ── Profile completion ─────────────────────────────────────────────────────────

export function scoreProfile(m: RawMentor): ProfileField[] {
  const svc = mentorServices(m)
  const hasServices = (m.servicesOffered?.length ?? 0) > 0 || svc.video || svc.audio || svc.chat
  const hasAvailability = nonEmpty(m.availability?.weekly)

  return [
    { key: 'profilePicture',    label: 'Profile Photo',    filled: nonEmpty(m.profilePicture) },
    { key: 'bio',               label: 'Bio',              filled: nonEmpty(m.bio) },
    { key: 'education',         label: 'Education',        filled: nonEmpty(m.education) },
    { key: 'expertise',         label: 'Expertise',        filled: nonEmpty(m.expertise) },
    { key: 'skills',            label: 'Skills',           filled: nonEmpty(m.skills) },
    { key: 'linkedinProfile',   label: 'LinkedIn',         filled: nonEmpty(m.linkedinProfile) },
    { key: 'companyDomain',     label: 'Company / Domain', filled: nonEmpty(m.companyDomain) || nonEmpty(m.topCompanies) },
    { key: 'primaryDomain',     label: 'Mentoring Domain', filled: nonEmpty(m.primaryDomain) },
    { key: 'servicesOffered',   label: 'Services',         filled: hasServices },
    { key: 'availability',      label: 'Availability',     filled: hasAvailability },
    { key: 'yearsOfExperience', label: 'Experience',       filled: nonEmpty(m.yearsOfExperience) },
    { key: 'milestones',        label: 'Achievements',     filled: nonEmpty(m.milestones) },
  ]
}

export function completionPct(m: RawMentor): number {
  const fields = scoreProfile(m)
  return Math.round(fields.filter(f => f.filled).length / fields.length * 100)
}

export function mentorName(m: RawMentor): string {
  return m.name || m.username || m.fullName || m.email?.split('@')[0] || 'Unknown'
}

export function isActive(m: RawMentor, days = 7): boolean {
  if (!m.lastActive) return false
  return new Date(m.lastActive).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000
}

// ── API ───────────────────────────────────────────────────────────────────────
export const mentorDashboardApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAtyantMentors: b.query<RawMentor[], { limit?: number; skip?: number } | void>({
      query: (params) => ({
        url: '/atyant/mentors',
        params: { limit: params?.limit ?? 2000, skip: params?.skip ?? 0 },
      }),
      transformResponse: (res: unknown): RawMentor[] =>
        Array.isArray(res) ? (res as RawMentor[]) : ((res as { data?: RawMentor[] })?.data ?? []),
      providesTags: ['Mentor'],
    }),
    getAtyantStats: b.query<AtyantStats, void>({
      query: () => '/atyant/stats',
      providesTags: ['Dashboard'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetAtyantMentorsQuery, useGetAtyantStatsQuery } = mentorDashboardApi
