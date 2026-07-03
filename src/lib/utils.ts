import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInCalendarDays, differenceInMinutes, format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  return format(new Date(date), fmt)
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function formatRelative(date: string | Date): string {
  const d = new Date(date)
  if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`
  if (isTomorrow(d)) return `Tomorrow at ${format(d, 'h:mm a')}`
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDue(
  date: string | Date,
  status?: string,
  submittedAt?: string | Date
): {
  label: string
  isOverdue: boolean
  health: 'onTrack' | 'atRisk' | 'delayed'
  healthLabel: string
} {
  const d = new Date(date)
  const normalizedStatus = status?.toLowerCase()

  if (normalizedStatus === 'done' || normalizedStatus === 'completed') {
    if (submittedAt) {
  const submittedDate = new Date(submittedAt)

  if (submittedDate > d) {
  const delayedMinutes = differenceInMinutes(submittedDate, d)
  const delayedDays = differenceInCalendarDays(submittedDate, d)

  let delayLabel = ''

  if (delayedMinutes < 60) {
    delayLabel = `${delayedMinutes} min${delayedMinutes > 1 ? 's' : ''} late`
  } else if (delayedMinutes < 1440) {
    const hours = Math.floor(delayedMinutes / 60)
    delayLabel = `${hours} hr${hours > 1 ? 's' : ''} late`
  } else {
    delayLabel = `${Math.max(delayedDays, 1)} day${Math.max(delayedDays, 1) > 1 ? 's' : ''} late`
  }

  return {
    label: `Completed · ${delayLabel}`,
    isOverdue: false,
    health: 'delayed',
    healthLabel: 'Completed Late',
  }
}
}

    return {
      label: 'Completed',
      isOverdue: false,
      health: 'onTrack',
      healthLabel: 'Completed',
    }
  }

  const isOverdue = isPast(d)
  const daysLeft = differenceInCalendarDays(d, new Date())

  let label: string
  let health: 'onTrack' | 'atRisk' | 'delayed'
  let healthLabel: string

  if (isOverdue) {
    health = 'delayed'
    healthLabel = 'Delayed'
    label = `Delayed · ${formatDistanceToNow(d, { addSuffix: false })} ago`
  } else if (daysLeft <= 3) {
    health = 'atRisk'
    healthLabel = 'At Risk'

    if (isToday(d)) label = `At Risk · Due today at ${format(d, 'h:mm a')}`
    else if (isTomorrow(d)) label = 'At Risk · Due tomorrow'
    else label = `At Risk · Due ${format(d, 'MMM d')}`
  } else {
    health = 'onTrack'
    healthLabel = 'On Track'
    label = `On Track · Due ${format(d, 'MMM d')}`
  }

  return { label, isOverdue, health, healthLabel }
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0] ?? '').join('').toUpperCase().slice(0, 2)
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return `${str.slice(0, maxLen)}…`
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function extractErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    if ('data' in err && err.data && typeof err.data === 'object' && 'message' in err.data)
      return String((err.data as { message: string }).message)
    if ('message' in err) return String((err as { message: string }).message)
  }
  return 'An unexpected error occurred'
}

export function getFollowUpStatus(dateStr: string, today: Date): {
  type: 'none' | 'overdue' | 'today' | 'upcoming'
  text: string
  pillClass: string
  tooltipText: string
} {
  if (!dateStr || dateStr === 'Not set') {
    return {
      type: 'none',
      text: 'Not set',
      pillClass: 'bg-gray-50 text-gray-400 border border-gray-100',
      tooltipText: 'No follow-up date scheduled',
    }
  }

  const d = new Date(dateStr)
  if (isNaN(d.getTime())) {
    return {
      type: 'none',
      text: 'Invalid Date',
      pillClass: 'bg-red-50 text-red-400 border border-red-100',
      tooltipText: 'Invalid follow-up date format',
    }
  }

  const diff = differenceInCalendarDays(d, today)

  if (diff < 0) {
    const daysAgo = Math.abs(diff)
    return {
      type: 'overdue',
      text: 'Overdue',
      pillClass: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
      tooltipText: `Overdue by ${daysAgo} day${daysAgo > 1 ? 's' : ''} (${formatDate(d)})`,
    }
  } else if (diff === 0) {
    return {
      type: 'today',
      text: 'Due Today',
      pillClass: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100',
      tooltipText: `Follow-up is scheduled for today (${formatDate(d)})`,
    }
  } else {
    return {
      type: 'upcoming',
      text: `In ${diff} day${diff > 1 ? 's' : ''}`,
      pillClass: 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100',
      tooltipText: `Scheduled for ${formatDate(d)}`,
    }
  }
}