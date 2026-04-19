'use client'
import { Search } from 'lucide-react'

interface TopbarProps { title: string; subtitle?: string; actions?: React.ReactNode }

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header className="ops-topbar px-6 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-gray-900 truncate leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search…"
          className="pl-8 pr-4 py-1.5 text-sm rounded-md border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 w-52 transition-all" />
      </div>
      {actions}
    </header>
  )
}
