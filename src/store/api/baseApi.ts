import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'
import { API_BASE } from '@/lib/constants'
import { clearCredentials } from '../slices/authSlice'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  credentials: 'include',
  prepareHeaders(headers, { getState }) {
    const token = (getState() as RootState).auth.token
    if (token) headers.set('Authorization', `Bearer ${token}`)
    headers.set('Content-Type', 'application/json')
    return headers
  },
})

export const baseQueryWithAuthGuard: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions)
    if (result.error?.status === 401) {
      const url = typeof args === 'string' ? args : (args as FetchArgs).url ?? ''
      if (!url.includes('/auth/login') && !url.includes('/auth/accept-invite')) {
        api.dispatch(clearCredentials())
        if (typeof window !== 'undefined') window.location.href = '/login'
      }
    }
    return result
  }

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuthGuard,
  tagTypes: ['Auth', 'Mentor', 'Student', 'Session', 'Task', 'User', 'Dashboard', 'Notification'],
  keepUnusedDataFor: 60,
  endpoints: () => ({}),
})
