import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { baseApi } from './api/baseApi'
import authReducer from './slices/authSlice'

import './api/authApi'
import './api/mentorsApi'
import './api/studentsApi'
import './api/sessionsApi'
import './api/tasksApi'
import './api/usersApi'
import './api/dashboardApi'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (g) => g({
    serializableCheck: {
      ignoredActionPaths: [
        'payload.data',
        'meta.baseQueryMeta.request',   // ← add this
        'meta.baseQueryMeta.response',  // ← add this too
      ],
    }
  }).concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
})

setupListeners(store.dispatch)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
