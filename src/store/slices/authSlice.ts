import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
}


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
      // ✅ localStorage mein save karo
      if (typeof window !== 'undefined') {
        localStorage.setItem('atyant_token', action.payload.token)
        localStorage.setItem('atyant_user', JSON.stringify(action.payload.user))
      }
    },
    // ✅ Sirf token set karo — page refresh pe use hota hai
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload
      state.isAuthenticated = true
      // User bhi restore karo agar localStorage mein hai
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('atyant_user')
        if (userStr) {
          try {
            state.user = JSON.parse(userStr)
          } catch {
            // ignore
          }
        }
      }
    },
    clearCredentials(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      if (typeof window !== 'undefined') {
        localStorage.removeItem('atyant_token')
        localStorage.removeItem('atyant_user')
      }
    },
    updateCurrentUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        if (typeof window !== 'undefined') {
          localStorage.setItem('atyant_user', JSON.stringify(state.user))
        }
      }
    },
  },
})

export const { setCredentials, setToken, clearCredentials, updateCurrentUser } = authSlice.actions
export default authSlice.reducer
