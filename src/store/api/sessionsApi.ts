import { baseApi } from './baseApi'
import type { Session } from '@/types'

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getSessions: b.query<Session[], Record<string, string> | void>({
      query: (params) => ({ url: '/sessions', params: params || {} }),
      providesTags: ['Session'],
    }),
    createSession: b.mutation<Session, Partial<Session>>({
      query: (body) => ({ url: '/sessions', method: 'POST', body }),
      invalidatesTags: ['Session'],
    }),
    updateSession: b.mutation<Session, { id: string; data: Partial<Session> }>({
      query: ({ id, data }) => ({ url: `/sessions/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Session'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetSessionsQuery, useCreateSessionMutation, useUpdateSessionMutation } = sessionsApi
