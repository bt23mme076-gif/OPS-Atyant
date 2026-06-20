import { baseApi } from './baseApi'

export interface RawEducation {
  institutionName?: string
  institution?: string
  degree?: string
  field?: string
  year?: string | number
  cgpa?: string | number
}

export interface RawMentor {
  _id: string
  name?: string
  fullName?: string
  email?: string
  phone?: string
  role?: string
  profilePicture?: string
  bio?: string
  education?: RawEducation[]
  skills?: unknown          // may be string[], JSON string, or other
  expertise?: unknown       // may be string, string[], or JSON string
  linkedinProfile?: string
  topCompanies?: unknown    // may be string[] or JSON string
  companyDomain?: string
  primaryDomain?: string
  price?: number
  services?: unknown        // may be string[], object[], or object map
  sessionTypes?: unknown
  serviceTypes?: unknown
  yearsOfExperience?: number
  milestones?: unknown[]
  availability?: { weekly?: unknown[] } | null
  city?: string
  location?: string
  isVerified?: boolean
  mentorListed?: boolean
  isOnline?: boolean
  lastActive?: string
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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// Parse any value into a flat list of strings (handles arrays of objects too)
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
        // Skip explicitly disabled services
        if (o.enabled === false || o.active === false || o.isEnabled === false) return []
        // Prefer type/name/id/slug/serviceType fields
        const typeVal = o.type ?? o.name ?? o.id ?? o.slug ?? o.serviceType ?? o.service
        if (typeVal && typeof typeVal === 'string') return [typeVal]
        // Fallback: collect all string values from the object
        return Object.values(o).filter((x): x is string => typeof x === 'string')
      }
      return []
    })
  }
  if (typeof v === 'object') {
    // Object map: { 'video-call': true/enabled-object, 'audio-call': false }
    return Object.entries(v as Record<string, unknown>)
      .filter(([, val]) => {
        if (typeof val === 'boolean') return val
        if (val && typeof val === 'object') {
          const o = val as Record<string, unknown>
          return o.enabled !== false  // enabled unless explicitly false
        }
        return Boolean(val)
      })
      .map(([key]) => key)
  }
  return []
}

// ── Services ─────────────────────────────────────────────────────────────────

export function mentorServices(m: RawMentor): { video: boolean; audio: boolean; chat: boolean } {
  const allStrings = [
    ...extractStrings(m.services),
    ...extractStrings(m.sessionTypes),
    ...extractStrings(m.serviceTypes),
  ].map(s => s.toLowerCase().replace(/[\s_]/g, '-').trim())

  const has = (keywords: string[]) =>
    allStrings.some(s => keywords.some(k => s.includes(k)))

  return {
    video: has(['video']),
    audio: has(['audio', 'voice']),
    // text-qa, chat, personal-chat, message, text, q&a, qa all count as chat
    chat:  has(['chat', 'text', 'message', 'q&a', 'qa']),
  }
}

// Returns true if this mentor has ANY enabled service
export function hasAnyService(m: RawMentor): boolean {
  const svc = mentorServices(m)
  return svc.video || svc.audio || svc.chat
}

// Returns all enabled service labels for display
export function serviceLabels(m: RawMentor): string[] {
  const raw = m.services
  if (!raw) return []

  // If it's an array of objects with name/type fields, extract meaningful labels
  if (Array.isArray(raw)) {
    const labels: string[] = []
    raw.forEach(item => {
      if (typeof item === 'string') {
        labels.push(item)
      } else if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        // Skip if explicitly disabled
        if (o.enabled === false) return
        const label = String(o.name ?? o.type ?? o.id ?? o.slug ?? '')
        if (label) labels.push(label)
      }
    })
    return labels
  }
  return extractStrings(raw)
}

// ── Profile completion ────────────────────────────────────────────────────────
// Mirrors Atyant platform's own checklist (12 fields, no Verified — that's admin-only)

export function scoreProfile(m: RawMentor): ProfileField[] {
  const svc = mentorServices(m)
  const hasAvailability = nonEmpty(m.availability?.weekly) ||
    (m.availability != null && typeof m.availability === 'object' &&
      Object.keys(m.availability as object).length > 0)

  return [
    { key: 'profilePicture',    label: 'Profile Photo',    filled: nonEmpty(m.profilePicture) },
    { key: 'bio',               label: 'Bio',              filled: nonEmpty(m.bio) },
    { key: 'education',         label: 'Education',        filled: nonEmpty(m.education) },
    { key: 'expertise',         label: 'Expertise',        filled: nonEmpty(m.expertise) },
    { key: 'skills',            label: 'Skills',           filled: nonEmpty(m.skills) },
    { key: 'linkedinProfile',   label: 'LinkedIn',         filled: nonEmpty(m.linkedinProfile) },
    { key: 'companyDomain',     label: 'Company / Domain', filled: nonEmpty(m.companyDomain) || nonEmpty(m.topCompanies) },
    { key: 'primaryDomain',     label: 'Mentoring Domain', filled: nonEmpty(m.primaryDomain) },
    { key: 'services',          label: 'Services',         filled: svc.video || svc.audio || svc.chat },
    { key: 'availability',      label: 'Availability',     filled: hasAvailability },
    { key: 'yearsOfExperience', label: 'Experience',       filled: nonEmpty(m.yearsOfExperience) },
    { key: 'milestones',        label: 'Achievements',     filled: nonEmpty(m.milestones) },
  ]
}

export function completionPct(m: RawMentor): number {
  const fields = scoreProfile(m)
  const filled = fields.filter(f => f.filled).length
  return Math.round((filled / fields.length) * 100)
}

export function mentorName(m: RawMentor): string {
  return m.name || m.fullName || m.email?.split('@')[0] || 'Unknown'
}

export function isActive(m: RawMentor, days = 7): boolean {
  if (!m.lastActive) return false
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return new Date(m.lastActive).getTime() >= cutoff
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
