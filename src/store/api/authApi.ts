import { baseApi } from './baseApi'
import type { LoginRequest, LoginResponse, AuthUser } from '@/types'

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    logout: b.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    getMe: b.query<AuthUser, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    acceptInvite: b.mutation<LoginResponse, { token: string; name: string; password: string }>({
      query: (body) => ({ url: '/auth/accept-invite', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
})

export const { useLoginMutation, useLogoutMutation, useGetMeQuery, useAcceptInviteMutation } = authApi
