import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

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

export function formatDue(date: string | Date): { label: string; isOverdue: boolean } {
  const d = new Date(date)
  const isOverdue = isPast(d)
  let label: string
  if (isOverdue) label = `Overdue · ${formatDistanceToNow(d, { addSuffix: false })} ago`
  else if (isToday(d)) label = `Due today at ${format(d, 'h:mm a')}`
  else if (isTomorrow(d)) label = `Due tomorrow`
  else label = `Due ${format(d, 'MMM d')}`
  return { label, isOverdue }
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
