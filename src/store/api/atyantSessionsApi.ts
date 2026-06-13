import { baseApi } from './baseApi'

// Session document from MongoDB `sessions` collection, enriched server-side with
// the student's name/email (looked up from `users` by userId).
export interface AtyantSession {
  _id: string
  userId?: string
  mentorId?: string
  mentorName?: string
  mentorInitials?: string
  topic?: string
  serviceId?: string
  scheduledAt?: string
  durationMin?: number
  status?: string | null
  pipelineStatus?: string
  amount?: number
  currency?: string
  paymentStatus?: string | null
  payoutStatus?: string
  meetingLink?: string
  studentName?: string
  studentEmail?: string
  createdAt?: string
  updatedAt?: string
}

export interface SessionStats {
  total: number
  upcoming: number
  thisWeek: number
  completed: number
  cancelled: number
  pending: number
  paidRevenue: number
}

export const atyantSessionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAtyantSessions: b.query<AtyantSession[], { status?: string } | void>({
      query: (params) => ({
        url: '/atyant/sessions',
        params: params?.status && params.status !== 'all' ? { status: params.status } : {},
      }),
      transformResponse: (res: unknown): AtyantSession[] =>
        Array.isArray(res) ? (res as AtyantSession[]) : ((res as { data?: AtyantSession[] })?.data ?? []),
      providesTags: ['Session'],
    }),
    getAtyantSessionStats: b.query<SessionStats, void>({
      query: () => '/atyant/sessions/stats',
      providesTags: ['Session'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetAtyantSessionsQuery, useGetAtyantSessionStatsQuery } = atyantSessionsApi
