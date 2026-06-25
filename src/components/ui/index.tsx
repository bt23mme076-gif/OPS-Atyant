'use client'
import React from 'react'
import { Loader2, X, Mail, Linkedin, Phone, Github } from 'lucide-react'
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

// ─── Avatar ───────────────────────────────────────────────────────────────────

type AvatarStatus = 'online' | 'offline' | 'away' | 'busy'

interface AvatarProps {
  name: string
  image?: string
  size?: number
  bg?: string
  /** Show a coloured status dot */
  status?: AvatarStatus
  /** Renders a thin ring around the avatar */
  ring?: boolean
  /** Colour of the ring (tailwind border colour or hex) */
  ringColor?: string
  /** Extra class names on the wrapper */
  className?: string
  /** Called when the avatar is clicked */
  onClick?: () => void
}

const STATUS_COLOR: Record<AvatarStatus, string> = {
  online:  '#22C55E',
  away:    '#F59E0B',
  busy:    '#EF4444',
  offline: '#9CA3AF',
}

export function Avatar({
  name,
  image,
  size = 32,
  bg = '#2563EB',
  status,
  ring = false,
  ringColor = '#2563EB',
  className,
  onClick,
}: AvatarProps) {
  // Dot is 25 % of avatar size, clamped between 8 – 14 px
  const dotSize   = Math.min(14, Math.max(8, Math.round(size * 0.25)))
  const fontSize  = Math.floor(size * 0.38)
  const isClickable = typeof onClick === 'function'

  const [imgError, setImgError] = React.useState(false)
  const showImage = image && !imgError

  /* ── wrapper ── */
  const wrapperStyle: React.CSSProperties = {
    position:   'relative',
    display:    'inline-flex',
    flexShrink: 0,
    width:      size,
    height:     size,
    cursor:     isClickable ? 'pointer' : 'default',
  }

  /* ── inner circle shared styles ── */
  const circleBase: React.CSSProperties = {
    width:        '100%',
    height:       '100%',
    borderRadius: '50%',
    overflow:     'hidden',
    // ring via box-shadow so it never shifts layout
    boxShadow: ring
      ? `0 0 0 2px white, 0 0 0 4px ${ringColor}`
      : '0 1px 3px rgba(0,0,0,0.12)',
    transition: 'box-shadow 0.2s, transform 0.15s',
  }

  /* ── status dot ── */
  const dot = status ? (
    <span
      aria-label={status}
      style={{
        position:     'absolute',
        bottom:       ring ? 1 : 0,
        right:        ring ? 1 : 0,
        width:        dotSize,
        height:       dotSize,
        borderRadius: '50%',
        background:   STATUS_COLOR[status],
        border:       '2px solid white',
        // subtle pulse only when online
        animation:    status === 'online' ? 'avatarPulse 2s ease-in-out infinite' : undefined,
      }}
    />
  ) : null

  /* ── image variant ── */
  if (showImage) {
    return (
      <>
        <style>{`
          @keyframes avatarPulse {
            0%, 100% { box-shadow: 0 0 0 0 ${STATUS_COLOR.online}66; }
            50%       { box-shadow: 0 0 0 4px ${STATUS_COLOR.online}00; }
          }
        `}</style>

        <div
          style={wrapperStyle}
          className={cn(
            'group select-none',
            isClickable && 'hover:[&>div]:scale-105 active:[&>div]:scale-95',
            className
          )}
          onClick={onClick}
          role={isClickable ? 'button' : undefined}
          tabIndex={isClickable ? 0 : undefined}
          onKeyDown={isClickable
            ? (e) => e.key === 'Enter' && onClick?.()
            : undefined}
        >
          <div style={circleBase}>
            <img
              src={image}
              alt={name}
              onError={() => setImgError(true)}
              style={{
                width:      '100%',
                height:     '100%',
                objectFit:  'cover',
                display:    'block',
              }}
            />
          </div>
          {dot}
        </div>
      </>
    )
  }

  /* ── initials / fallback variant ── */
  // Generate a consistent colour from the name when no bg is passed
  const autoBg = bg === '#2563EB' ? stringToColor(name) : bg

  return (
    <>
      <style>{`
        @keyframes avatarPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${STATUS_COLOR.online}66; }
          50%       { box-shadow: 0 0 0 4px ${STATUS_COLOR.online}00; }
        }
      `}</style>

      <div
        style={wrapperStyle}
        className={cn(
          'group select-none',
          isClickable && 'hover:[&>div]:scale-105 active:[&>div]:scale-95',
          className
        )}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable
          ? (e) => e.key === 'Enter' && onClick?.()
          : undefined}
      >
        <div
          style={{
            ...circleBase,
            background:     autoBg,
            color:          'white',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:        fontSize,
            fontWeight:      600,
            letterSpacing:  '0.02em',
            userSelect:     'none',
          }}
        >
          {getInitials(name)}
        </div>
        {dot}
      </div>
    </>
  )
}

/**
 * Deterministically maps a string → a pleasant dark-ish hex colour.
 * Used so every person always gets the same avatar background.
 */
function stringToColor(str: string): string {
  const PALETTE = [
    '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
    '#D97706', '#059669', '#0891B2', '#4F46E5',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

// ─── Avatar Group ─────────────────────────────────────────────────────────────

interface AvatarGroupProps {
  /** Each item can be anything Avatar accepts */
  avatars: Array<Pick<AvatarProps, 'name' | 'image' | 'bg'>>
  /** How many to show before "+N" overflow bubble */
  max?: number
  size?: number
  /** Negative margin overlap in px (default 8) */
  overlap?: number
  className?: string
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 32,
  overlap = 8,
  className,
}: AvatarGroupProps) {
  const visible  = avatars.slice(0, max)
  const overflow = avatars.length - max
  const fontSize = Math.floor(size * 0.32)

  return (
    <div
      className={cn('flex items-center', className)}
      style={{ paddingLeft: overlap }}
    >
      {visible.map((a, i) => (
        <div
          key={i}
          style={{
            marginLeft:  i === 0 ? 0 : -overlap,
            zIndex:      visible.length - i,
            borderRadius: '50%',
            boxShadow:   '0 0 0 2px white',
          }}
        >
          <Avatar name={a.name} image={a.image} bg={a.bg} size={size} />
        </div>
      ))}

      {overflow > 0 && (
        <div
          style={{
            marginLeft:     -overlap,
            zIndex:         0,
            width:          size,
            height:         size,
            borderRadius:   '50%',
            background:     '#E5E7EB',
            color:          '#4B5563',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       fontSize,
            fontWeight:     600,
            boxShadow:      '0 0 0 2px white',
            flexShrink:     0,
          }}
        >
          +{overflow}
        </div>
      )}
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
  title?: React.ReactNode
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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'bg-white rounded-xl shadow-xl w-full flex flex-col my-4 sm:my-0',
          'max-h-[calc(100dvh-32px)]',
          widths[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-5 overflow-y-auto min-h-0">{children}</div>
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

// WhatsApp Icon
export function WhatsAppIcon({
  size = 16,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.459 3.477 1.332 5.003L2 22l5.146-1.35c1.472.802 3.126 1.222 4.862 1.222 5.508 0 9.99-4.482 9.99-9.988 0-2.659-1.036-5.161-2.92-7.048C17.186 3.037 14.68 2 12.012 2zm0 1.696c2.21 0 4.29.861 5.857 2.428a8.219 8.219 0 0 1 2.429 5.864c0 4.572-3.72 8.293-8.286 8.293-1.442 0-2.853-.377-4.1-1.094l-.294-.17L4.72 20.082l.983-2.903-.187-.297a8.243 8.243 0 0 1-1.261-4.394c0-4.572 3.72-8.293 8.286-8.293zm-3.344 4.887c-.183-.41-.376-.418-.55-.426-.142-.006-.304-.006-.467-.006-.162 0-.426.061-.649.304-.223.243-.852.833-.852 2.029 0 1.196.872 2.348.994 2.51.121.162 1.716 2.62 4.156 3.673.58.25 1.033.4 1.385.512.583.186 1.114.16 1.533.097.467-.07 1.44-.588 1.643-1.157.203-.568.203-1.055.142-1.157-.06-.101-.223-.162-.487-.294-.264-.132-1.562-.771-1.805-.859-.243-.087-.42-.132-.6.132-.18.264-.697.872-.852 1.05-.155.178-.31.201-.574.07-.264-.132-1.114-.41-2.122-1.31-.784-.7-1.314-1.564-1.468-1.828-.155-.264-.016-.407.116-.538.118-.119.264-.31.396-.464.131-.155.175-.264.263-.44.088-.176.044-.33-.021-.462-.066-.132-.55-1.326-.759-1.826z" />
    </svg>
  )
}

// Social Icon Button
export function SocialIconButton({
  icon,
  href,
  tooltip,
  colorClass,
}: {
  icon: React.ReactNode
  href?: string
  tooltip: string
  colorClass: string
}) {
  const content = (
    <span
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full border bg-white shadow-sm transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer',
        colorClass
      )}
    >
      {icon}
    </span>
  )

  return (
    <div className="relative group inline-block">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
      <div className="absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 scale-75 rounded bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 pointer-events-none transition-all duration-200 ease-out origin-bottom group-hover:scale-100 group-hover:opacity-100 shadow-md">
        {tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900" />
      </div>
    </div>
  )
}
