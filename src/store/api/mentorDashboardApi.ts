import { baseApi } from './baseApi'

// ── Raw mentor document shape (from MongoDB `users` collection, role: 'mentor') ──
// Only the fields the dashboard relies on are typed; the backend returns the full
// document minus secrets, so unknown extra keys are allowed via the index signature.
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
  skills?: string[]
  expertise?: string | string[]
  linkedinProfile?: string
  topCompanies?: string[]
  companyDomain?: string
  primaryDomain?: string
  price?: number
  yearsOfExperience?: number
  milestones?: unknown[]
  availability?: { weekly?: unknown[] } | null
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

// ── Profile-completion scoring ───────────────────────────────────────────────
// The 13 fields that define a "complete" mentor profile. Each is weighted equally.
export interface ProfileField {
  key: string
  label: string
  filled: boolean
}

function nonEmpty(v: unknown): boolean {
  if (v == null) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'number') return v > 0
  return Boolean(v)
}

export function scoreProfile(m: RawMentor): ProfileField[] {
  return [
    { key: 'profilePicture',   label: 'Profile Photo',  filled: nonEmpty(m.profilePicture) },
    { key: 'bio',              label: 'Bio',            filled: nonEmpty(m.bio) },
    { key: 'education',        label: 'Education',      filled: nonEmpty(m.education) },
    { key: 'skills',           label: 'Skills',         filled: nonEmpty(m.skills) },
    { key: 'expertise',        label: 'Expertise',      filled: nonEmpty(m.expertise) },
    { key: 'linkedinProfile',  label: 'LinkedIn',       filled: nonEmpty(m.linkedinProfile) },
    { key: 'companyDomain',    label: 'Company / Domain', filled: nonEmpty(m.companyDomain) || nonEmpty(m.topCompanies) },
    { key: 'price',            label: 'Pricing',        filled: nonEmpty(m.price) },
    { key: 'availability',     label: 'Availability',   filled: nonEmpty(m.availability?.weekly) },
    { key: 'yearsOfExperience',label: 'Experience',     filled: nonEmpty(m.yearsOfExperience) },
    { key: 'milestones',       label: 'Achievements',   filled: nonEmpty(m.milestones) },
    { key: 'primaryDomain',    label: 'Primary Domain', filled: nonEmpty(m.primaryDomain) },
    { key: 'isVerified',       label: 'Verified',       filled: Boolean(m.isVerified) },
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

// ── API endpoints ────────────────────────────────────────────────────────────
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
