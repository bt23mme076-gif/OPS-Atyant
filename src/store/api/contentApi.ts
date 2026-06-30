import { baseApi } from './baseApi'

export interface UploadedPost {
  id: string
  platform: 'Instagram' | 'LinkedIn'
  postUrl: string
  uploadedBy: string
  createdAt: string
}

export const contentApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getUploadedPosts: b.query<UploadedPost[], void>({
      query: () => '/content/uploaded-posts',
      providesTags: ['UploadedPost'],
    }),
    createUploadedPost: b.mutation<UploadedPost, { platform: 'Instagram' | 'LinkedIn'; postUrl: string }>({
      query: (body) => ({
        url: '/content/uploaded-posts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['UploadedPost'],
    }),
    deleteUploadedPost: b.mutation<void, string>({
      query: (id) => ({
        url: `/content/uploaded-posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UploadedPost'],
    }),
  }),
  overrideExisting: true,
})

export const { useGetUploadedPostsQuery, useCreateUploadedPostMutation, useDeleteUploadedPostMutation } = contentApi
