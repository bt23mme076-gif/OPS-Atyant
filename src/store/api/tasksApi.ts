import { baseApi } from './baseApi'
import type { Task } from '@/types'

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTasks: b.query<Task[], Record<string, string> | void>({
      query: (params) => ({ url: '/tasks', params: params || {} }),
      providesTags: ['Task'],
    }),

    getMyTasks: b.query<Task[], void>({
      query: () => '/tasks/my',
      providesTags: ['Task'],
    }),
    getTasksLeaderboard: b.query<
  { id: string; name: string; squad?: string; points: number; done: number; rank: number }[],
  void
>({
  query: () => '/tasks/leaderboard',
  providesTags: ['Task'],
}),

    createTask: b.mutation<Task, Partial<Task>>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: ['Task'],
    }),

    updateTask: b.mutation<Task, { id: string; data: Partial<Task> }>({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Task'],
    }),

    deleteTask: b.mutation<{ success: boolean; deletedId?: string }, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),

    sendTaskFollowUp: b.mutation<
      { success: boolean; message: string },
      { id: string; message?: string }
    >({
      query: ({ id, message }) => ({
        url: `/tasks/${id}/follow-up`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Task'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetTasksQuery,
  useGetMyTasksQuery,
  useGetTasksLeaderboardQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useSendTaskFollowUpMutation,
} = tasksApi