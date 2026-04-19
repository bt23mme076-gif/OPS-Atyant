'use client'
import { useEffect } from 'react'
import { useIsAuthenticated } from '@/store/hooks'
import { Sidebar } from '@/components/layout/Sidebar'
import { Spinner } from '@/components/ui'
import { useGetMeQuery } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isAuth = useIsAuthenticated()
  const dispatch = useAppDispatch()

  const { isLoading, data, error } = useGetMeQuery(undefined, { skip: isAuth })

  useEffect(() => {
    if (data) dispatch(setCredentials({ user: data, token: '' }))
  }, [data, dispatch])

  useEffect(() => {
    if (isLoading) return
    if (isAuth) return
    if (data) return
    // ✅ Only redirect if getMe actually failed with 401, not any other error
    if (error && (error as any).status === 401) {
      window.location.href = '/login'
    }
  }, [isLoading, isAuth, data, error])

  if (isLoading || (!isAuth && !data && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <Spinner size={28} />
      </div>
    )
  }

  if (!isAuth && !data) return null

  return (
    <div className="ops-shell">
      <Sidebar />
      <div className="ops-main">
        <main className="ops-content">{children}</main>
      </div>
    </div>
  )
}