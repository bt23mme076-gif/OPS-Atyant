'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Video,
  CheckSquare,
  Shield,
  Settings,
  LogOut,
  Bell,
  LayoutGrid,
  Sparkles,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAppDispatch, useCurrentUser } from '@/store/hooks'
import { clearCredentials } from '@/store/slices/authSlice'
import { useLogoutMutation } from '@/store/api/authApi'
import { useGetNotificationsQuery } from '@/store/api/dashboardApi'
import { NAV_ITEMS } from '@/lib/constants'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  Video,
  CheckSquare,
  Shield,
  Settings,
  LayoutGrid,
}

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const user = useCurrentUser()
  const [logoutApi] = useLogoutMutation()
  const { data: notifications = [] } = useGetNotificationsQuery({ isRead: false, limit: 50 })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const hasUnread = unreadCount > 0
  const isNotificationsActive = pathname.startsWith('/notifications')

  async function handleLogout() {
    try {
      await logoutApi().unwrap()
    } catch {}

    dispatch(clearCredentials())
    window.location.href = '/login'
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col flex-1 select-none overflow-y-auto">
      <div className="hidden md:block px-5 py-4 border-b border-white/10">
        <div className="text-white font-bold text-base tracking-tight">Atyant</div>
        <div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
          OPS — Internal
        </div>
      </div>

      <Link
        href="/notifications"
        onClick={onNavigate}
        className={cn(
          'relative mx-3 mt-3 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150',
          isNotificationsActive
            ? 'bg-primary text-white font-medium shadow-sm'
            : 'text-white/60 hover:text-white hover:bg-white/8'
        )}
      >
        <div className="relative">
          <Bell size={15} />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
          )}
        </div>

        <span className="flex-1">Notifications</span>

        {hasUnread && (
          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>

      {hasUnread && !isNotificationsActive && (
        <div className="mx-3 mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex items-center gap-2 text-[11px] text-white/70">
            <Sparkles size={12} className="text-yellow-300" />
            <span>
              You have <span className="font-bold text-white">{unreadCount}</span> unread update
              {unreadCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {NAV_ITEMS.map((section) => {
          const visibleItems = section.items.filter(item =>
            !item.roles || (user && item.roles.includes(user.role))
          )

          if (visibleItems.length === 0) return null

          return (
            <div key={section.section} className="mb-4">
              <div className="px-3 py-1 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                {section.section}
              </div>

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = ICON_MAP[item.icon]
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150',
                        active
                          ? 'bg-primary text-white font-medium'
                          : 'text-white/60 hover:text-white hover:bg-white/8'
                      )}
                    >
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

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/8 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">
              {user?.name ?? 'Loading...'}
            </div>
            <div className="text-white/40 text-[10px] capitalize truncate">
              {user?.role?.replace('_', ' ') ?? ''}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-red-400 transition-all md:opacity-0 md:group-hover:opacity-100"
            title="Logout"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}