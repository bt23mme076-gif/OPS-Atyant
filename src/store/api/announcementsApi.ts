import { baseApi } from './baseApi'

export type AnnouncementType = 'GENERAL' | 'MEETING' | 'DEADLINE' | 'URGENT'

export type Announcement = {
  id: number
  title: string
  message: string
  type: AnnouncementType
}

export const announcementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<Announcement[], void>({
      query: () => '/announcements',
      providesTags: ['Announcement'],
    }),

    getLatestAnnouncement: builder.query<Announcement | null, void>({
      query: () => '/announcements/latest',
      providesTags: ['Announcement'],
    }),

    createAnnouncement: builder.mutation<Announcement, {
      title: string
      message: string
      type: AnnouncementType
    }>({
      query: (body) => ({
        url: '/announcements',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Announcement'],
    }),

    deleteAnnouncement: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/announcements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Announcement'],
    }),
  }),
})

export const {
  useGetAnnouncementsQuery,
  useGetLatestAnnouncementQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = announcementsApi