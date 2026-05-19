'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, GraduationCap, Video, CheckSquare, Shield, Settings, LogOut, Bell, LayoutGrid, X } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@/store/hooks'
import { clearCredentials } from '@/store/slices/authSlice'
import { useLogoutMutation } from '@/store/api/authApi'
import { useGetNotificationsQuery } from '@/store/api/dashboardApi'
import { NAV_ITEMS } from '@/lib/constants'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, Users, GraduationCap, Video, CheckSquare, Shield, Settings, LayoutGrid,
}

export function Sidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const user     = useCurrentUser()
  const [logoutApi] = useLogoutMutation()
  const { data: notifications } = useGetNotificationsQuery({ isRead: false, limit: 50 })
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0

  async function handleLogout() {
    try { await logoutApi().unwrap() } catch {}
    dispatch(clearCredentials())
    window.location.href = '/login'
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className={cn('ops-sidebar flex flex-col select-none', isOpen && 'open')}>
      {/* Brand */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-base tracking-tight">Atyant</div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">OPS — Internal</div>
        </div>
        {/* Mobile Close Button */}
        <button onClick={onClose} className="md:hidden text-white/60 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* Notifications */}
      <Link href="/notifications" className="mx-3 mt-3 flex items-center gap-2.5 rounded-md px-3 py-2 text-white/60 hover:text-white hover:bg-white/8 transition-colors text-sm">
        <Bell size={15} />
        <span className="flex-1">Notifications</span>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {NAV_ITEMS.map((section) => {
          const visibleItems = section.items.filter(item => 
            !item.roles || (user && item.roles.includes(user.role))
          )
          
          if (visibleItems.length === 0) return null

          return (
            <div key={section.section} className="mb-4">
              <div className="px-3 py-1 text-[10px] font-semibold text-white/30 uppercase tracking-widest">{section.section}</div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = ICON_MAP[item.icon]
                  const active = isActive(item.href)
                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}
                      className={cn('flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150',
                        active ? 'bg-primary text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/8')}>
                      {Icon && <Icon size={15} className="flex-shrink-0" />}
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>


      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/8 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.name ?? 'Loading...'}</div>
            <div className="text-white/40 text-[10px] capitalize truncate">{user?.role?.replace('_', ' ') ?? ''}</div>
          </div>
          <button onClick={handleLogout} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all" title="Logout">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
