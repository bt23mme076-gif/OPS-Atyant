import { baseApi } from './baseApi'
import type { Mentor } from '@/types'

export const mentorsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMentors: b.query<Mentor[], Record<string, string> | void>({
      query: (params) => ({ url: '/mentors', params: params || {} }),
      providesTags: ['Mentor'],
    }),
    getLegacyMentors: b.query<Mentor[], void>({
      query: () => '/atyant/mentors?limit=1000',
      transformResponse: (response: any) => {
        const rawData = Array.isArray(response) ? response : (response?.data || response?.mentors || [])
        return rawData.map((m: any) => {
          // Comprehensive name extraction
          const name = m.name || m.fullName || m.displayName || m.username || 
                 m.profile?.name || m.profile?.fullName || 
                 (m.firstName ? `${m.firstName} ${m.lastName || ''}`.trim() : null) || 
                 m.email?.split('@')[0] || 'Unknown'
          
          // College/Company extraction
          const college = m.education?.[0]?.institutionName || m.education?.[0]?.institution || m.college || m.company || null
          
          // Services Mapping (Optimized for new backend response)
          const s = m.services || []
          const vCall = s.includes('video-call') || s.includes('video_call') || m.serviceType === 'video-call'
          const aCall = s.includes('audio-call') || s.includes('audio_call') || m.serviceType === 'audio-call'
          const pChat = s.includes('chat') || s.includes('personal-chat') || m.serviceType === 'chat'

          return {
            id: m._id || m.id || String(Math.random()),
            name,
            email: m.email || '',
            phone: m.phone || null,
            linkedin: m.linkedin || null,
            company: college,
            domain: (m.companyDomain || m.expertise || m.domain || 'other') as any,
            source: 'legacy_mongodb',
            stage: 'live',
            status: 'active',
            notes: `DEBUG services: ${JSON.stringify(m.services || [])} | ${m.notes || ''}`,
            legacyEducation: m.education,
            services: { video: vCall, audio: aCall, chat: pChat },
            createdAt: m.createdAt || m.lastActive || new Date().toISOString(),
            updatedAt: m.updatedAt || new Date().toISOString(),
          }
        })
      },
      providesTags: ['Mentor'],
    }),
    getMentor: b.query<Mentor, string>({
      query: (id) => `/mentors/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Mentor', id }],
    }),
    createMentor: b.mutation<Mentor, Partial<Mentor>>({
      query: (body) => ({ url: '/mentors', method: 'POST', body }),
      invalidatesTags: ['Mentor'],
    }),
    updateMentor: b.mutation<Mentor, { id: string; data: Partial<Mentor> }>({
      query: ({ id, data }) => ({ url: `/mentors/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Mentor', id }, 'Mentor'],
    }),
    updateMentorStage: b.mutation<Mentor, { id: string; stage: string }>({
      query: ({ id, stage }) => ({ url: `/mentors/${id}/stage`, method: 'PATCH', body: { stage } }),
      invalidatesTags: ['Mentor'],
    }),
    assignMentor: b.mutation<void, { id: string; assignToId: string }>({
      query: ({ id, assignToId }) => ({ url: `/mentors/${id}/assign`, method: 'PATCH', body: { assignToId } }),
      invalidatesTags: ['Mentor'],
    }),
    addMentorNote: b.mutation<void, { id: string; note: string }>({
      query: ({ id, note }) => ({ url: `/mentors/${id}/notes`, method: 'POST', body: { note } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Mentor', id }],
    }),
    deleteMentor: b.mutation<void, string>({
      query: (id) => ({ url: `/mentors/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Mentor'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetMentorsQuery, useGetLegacyMentorsQuery, useGetMentorQuery, useCreateMentorMutation,
  useUpdateMentorMutation, useUpdateMentorStageMutation,
  useAssignMentorMutation, useAddMentorNoteMutation, useDeleteMentorMutation,
} = mentorsApi
