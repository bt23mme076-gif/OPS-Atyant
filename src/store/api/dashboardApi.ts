import { baseApi } from './baseApi'
import type { DashboardStats, Notification } from '@/types'

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDashboard: b.query<DashboardStats, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
    getNotifications: b.query<Notification[], { isRead?: boolean; limit?: number } | void>({
      query: (params) => ({ url: '/notifications', params: params || {} }),
      providesTags: ['Notification'],
    }),
    markNotificationRead: b.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: b.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetDashboardQuery, useGetNotificationsQuery,
  useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation,
} = dashboardApi
