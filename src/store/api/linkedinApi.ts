import { baseApi } from './baseApi'
import type { LinkedinPost, LinkedinLead, LinkedinStats } from '@/types'

export const linkedinApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ─── Stats ───────────────────────────────────────────────
    getLinkedinStats: b.query<LinkedinStats, void>({
      query: () => '/linkedin/stats',
      providesTags: ['LinkedinStats'],
    }),

    // ─── Posts ───────────────────────────────────────────────
    getLinkedinPosts: b.query<LinkedinPost[], Record<string, string> | void>({
      query: (params) => ({ url: '/linkedin/posts', params: params || {} }),
      providesTags: ['LinkedinPost'],
    }),
    createLinkedinPost: b.mutation<LinkedinPost, Partial<LinkedinPost>>({
      query: (body) => ({ url: '/linkedin/posts', method: 'POST', body }),
      invalidatesTags: ['LinkedinPost', 'LinkedinStats'],
    }),
    updateLinkedinPost: b.mutation<LinkedinPost, { id: string; data: Partial<LinkedinPost> }>({
      query: ({ id, data }) => ({ url: `/linkedin/posts/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['LinkedinPost', 'LinkedinStats'],
    }),
    deleteLinkedinPost: b.mutation<void, string>({
      query: (id) => ({ url: `/linkedin/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['LinkedinPost', 'LinkedinStats', 'LinkedinLead'],
    }),

    // ─── Leads ───────────────────────────────────────────────
    getLinkedinLeads: b.query<LinkedinLead[], Record<string, string> | void>({
      query: (params) => ({ url: '/linkedin/leads', params: params || {} }),
      providesTags: ['LinkedinLead'],
    }),
    createLinkedinLead: b.mutation<LinkedinLead, Partial<LinkedinLead>>({
      query: (body) => ({ url: '/linkedin/leads', method: 'POST', body }),
      invalidatesTags: ['LinkedinLead', 'LinkedinStats', 'LinkedinPost'],
    }),
    updateLinkedinLead: b.mutation<LinkedinLead, { id: string; data: Partial<LinkedinLead> }>({
      query: ({ id, data }) => ({ url: `/linkedin/leads/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['LinkedinLead', 'LinkedinStats'],
    }),
    updateLinkedinLeadStage: b.mutation<LinkedinLead, { id: string; stage: string }>({
      query: ({ id, stage }) => ({ url: `/linkedin/leads/${id}/stage`, method: 'PATCH', body: { stage } }),
      invalidatesTags: ['LinkedinLead', 'LinkedinStats'],
    }),
    convertLinkedinLead: b.mutation<unknown, { id: string; target: 'mentor' | 'student' }>({
      query: ({ id, target }) => ({ url: `/linkedin/leads/${id}/convert`, method: 'POST', body: { target } }),
      invalidatesTags: ['LinkedinLead', 'LinkedinStats', 'Mentor', 'Student'],
    }),
    deleteLinkedinLead: b.mutation<void, string>({
      query: (id) => ({ url: `/linkedin/leads/${id}`, method: 'DELETE' }),
      invalidatesTags: ['LinkedinLead', 'LinkedinStats', 'LinkedinPost'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetLinkedinStatsQuery,
  useGetLinkedinPostsQuery, useCreateLinkedinPostMutation,
  useUpdateLinkedinPostMutation, useDeleteLinkedinPostMutation,
  useGetLinkedinLeadsQuery, useCreateLinkedinLeadMutation,
  useUpdateLinkedinLeadMutation, useUpdateLinkedinLeadStageMutation,
  useConvertLinkedinLeadMutation, useDeleteLinkedinLeadMutation,
} = linkedinApi
