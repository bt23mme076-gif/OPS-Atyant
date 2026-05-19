'use client'
import { useEffect, useState } from 'react'
import { useIsAuthenticated } from '@/store/hooks'
import { Sidebar } from '@/components/layout/Sidebar'
import { Spinner } from '@/components/ui'
import { useGetMeQuery } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'

import { Menu } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAuth = useIsAuthenticated()
  const dispatch = useAppDispatch()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { isLoading, data, error } = useGetMeQuery(undefined, { skip: !mounted || isAuth })

  useEffect(() => {
    if (data) dispatch(setCredentials({ user: data, token: '' }))
  }, [data, dispatch])

  useEffect(() => {
    if (!mounted) return
    if (isLoading) return
    if (isAuth) return
    if (data) return
    // ✅ Only redirect if getMe actually failed with 401, not any other error
    if (error && (error as any).status === 401) {
      window.location.href = '/login'
    }
  }, [mounted, isLoading, isAuth, data, error])

  if (!mounted || isLoading || (!isAuth && !data && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <Spinner size={28} />
      </div>
    )
  }

  if (!isAuth && !data) {
    if (error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6" style={{ background: '#F8FAFC' }}>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md w-full">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
            <p className="text-gray-500 text-sm mb-6">Could not connect to the backend server. Please verify your backend is running and the API URL is correct.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Retry</button>
              <button onClick={() => window.location.href = '/login'} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Go to Login</button>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="ops-shell">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shrink-0">
        <div className="font-bold text-lg text-gray-900">Atyant</div>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <Menu size={20} />
        </button>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="ops-main">
        <main className="ops-content">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  )
}