import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, AuthUser } from '@/types'
import { TOKEN_COOKIE } from '@/lib/constants'

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
    },
    clearCredentials(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      if (typeof document !== 'undefined') {
        document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`
      }
    },
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer

export const selectAuth            = (state: { auth: AuthState }) => state.auth
export const selectUser            = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectToken           = (state: { auth: AuthState }) => state.auth.token
