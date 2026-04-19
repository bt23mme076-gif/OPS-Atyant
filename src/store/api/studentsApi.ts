import { baseApi } from './baseApi'
import type { Student } from '@/types'

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getStudents: b.query<Student[], Record<string, string> | void>({
      query: (params) => ({ url: '/students', params: params || {} }),
      providesTags: ['Student'],
    }),
    getStudent: b.query<Student, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Student', id }],
    }),
    createStudent: b.mutation<Student, Partial<Student>>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: ['Student'],
    }),
    updateStudent: b.mutation<Student, { id: string; data: Partial<Student> }>({
      query: ({ id, data }) => ({ url: `/students/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Student', id }, 'Student'],
    }),
    updateStudentStage: b.mutation<Student, { id: string; stage: string }>({
      query: ({ id, stage }) => ({ url: `/students/${id}/stage`, method: 'PATCH', body: { stage } }),
      invalidatesTags: ['Student'],
    }),
    deleteStudent: b.mutation<void, string>({
      query: (id) => ({ url: `/students/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Student'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetStudentsQuery, useGetStudentQuery, useCreateStudentMutation,
  useUpdateStudentMutation, useUpdateStudentStageMutation, useDeleteStudentMutation,
} = studentsApi
