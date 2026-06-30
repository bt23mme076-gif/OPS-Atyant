import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { baseApi } from './api/baseApi'
import authReducer, { setToken } from './slices/authSlice'

import './api/authApi'
import './api/mentorsApi'
import './api/studentsApi'
import './api/sessionsApi'
import './api/tasksApi'
import './api/usersApi'
import './api/dashboardApi'
import './api/linkedinApi'
import './api/contentApi'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (g) => g({
    serializableCheck: {
      ignoredActionPaths: [
        'payload.data',
        'meta.baseQueryMeta.request',
        'meta.baseQueryMeta.response',
      ],
    }
  }).concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
})

// ✅ Page refresh pe localStorage se token restore karo
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('atyant_token')
  if (token) {
    store.dispatch(setToken(token))
  }
}

setupListeners(store.dispatch)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch