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
    createTask: b.mutation<Task, Partial<Task>>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: ['Task'],
    }),
    updateTask: b.mutation<Task, { id: string; data: Partial<Task> }>({
      query: ({ id, data }) => ({ url: `/tasks/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: b.mutation<void, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Task'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetTasksQuery, useGetMyTasksQuery, useCreateTaskMutation,
  useUpdateTaskMutation, useDeleteTaskMutation,
} = tasksApi
