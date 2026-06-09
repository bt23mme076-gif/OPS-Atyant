import { baseApi } from './baseApi'
import type { AuthUser } from '@/types'

export interface PendingInvite {
  id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'expired'
  createdAt: string
  expiresAt: string
  acceptedAt: string | null
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getUsers: b.query<AuthUser[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getPendingInvites: b.query<PendingInvite[], void>({
      query: () => '/users/invites',
      providesTags: ['User'],
    }),
    inviteUser: b.mutation<void, { email: string; role: string; squad?: string }>({
      query: (body) => ({ url: '/users/invite', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    deactivateUser: b.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'PATCH', body: { status: 'INACTIVE' } }),
      invalidatesTags: ['User'],
    }),
    reactivateUser: b.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'PATCH', body: { status: 'ACTIVE' } }),
      invalidatesTags: ['User'],
    }),
    revokeInvite: b.mutation<void, string>({
      query: (id) => ({ url: `/users/invites/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
    updateUser: b.mutation<void, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['User'],
    }),
    deleteUser: b.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetUsersQuery,
  useGetPendingInvitesQuery,
  useInviteUserMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useRevokeInviteMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi