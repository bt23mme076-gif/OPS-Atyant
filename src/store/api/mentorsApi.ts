import { baseApi } from './baseApi'
import type { Mentor } from '@/types'

export const mentorsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMentors: b.query<Mentor[], Record<string, string> | void>({
      query: (params) => ({ url: '/mentors', params: params || {} }),
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
  useGetMentorsQuery, useGetMentorQuery, useCreateMentorMutation,
  useUpdateMentorMutation, useUpdateMentorStageMutation,
  useAssignMentorMutation, useAddMentorNoteMutation, useDeleteMentorMutation,
} = mentorsApi
