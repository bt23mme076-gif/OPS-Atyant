import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './index'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector)

export const useAuth            = () => useAppSelector((s) => s.auth)
export const useCurrentUser     = () => useAppSelector((s) => s.auth.user)
export const useIsAuthenticated = () => useAppSelector((s) => s.auth.isAuthenticated)
export const useAuthToken       = () => useAppSelector((s) => s.auth.token)
