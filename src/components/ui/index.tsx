'use client'
import React from 'react'
import { Loader2, X } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md'
  loading?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'sm',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const v = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900',
    danger: 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100',
  }

  const s = {
    xs: 'px-2 py-1 text-[11px]',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        v[variant],
        s[size],
        className
      )}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : null}
      {children}
    </button>
  )
}

// Badge
export function Badge({
  children,
  color,
  bgColor,
  textColor,
  className,
}: {
  children: React.ReactNode
  color?: string
  bgColor?: string
  textColor?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium',
        className
      )}
      style={{
        backgroundColor: bgColor ?? '#F3F4F6',
        color: textColor ?? '#4B5563',
        border: `1px solid ${(color ?? '#E5E7EB')}40`,
      }}
    >
      {children}
    </span>
  )
}

// Avatar
export function Avatar({
  name,
  size = 32,
  bg = '#2563EB',
}: {
  name: string
  size?: number
  bg?: string
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.floor(size * 0.35),
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

// Spinner
export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-gray-400" />
}

// Modal
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!open) return null

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'bg-white rounded-xl shadow-xl w-full flex flex-col',
          'max-h-[90vh]',
          widths[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="font-semibold text-gray-900 text-sm">
              {title}
            </h2>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

// Empty state
export function Empty({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-gray-300 mb-3">{icon}</div>}
      <p className="text-gray-500 font-medium text-sm">{title}</p>
      {description && (
        <p className="text-gray-400 text-xs mt-1">{description}</p>
      )}
    </div>
  )
}