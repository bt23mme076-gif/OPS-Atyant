export const TOKEN_COOKIE = 'atyant_token'
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

export const MENTOR_STAGES = [
  { key: 'identified',    label: 'Identified',    color: '#6366F1', bgColor: '#EEF2FF', textColor: '#4338CA' },
  { key: 'outreach_sent', label: 'Outreach Sent', color: '#8B5CF6', bgColor: '#F5F3FF', textColor: '#7C3AED' },
  { key: 'call_scheduled',label: 'Call Scheduled',color: '#EC4899', bgColor: '#FDF2F8', textColor: '#BE185D' },
  { key: 'call_done',     label: 'Call Done',     color: '#F97316', bgColor: '#FFF7ED', textColor: '#C2410C' },
  { key: 'profile_setup', label: 'Profile Setup', color: '#EAB308', bgColor: '#FEFCE8', textColor: '#A16207' },
  { key: 'live',          label: 'Live ✓',        color: '#16A34A', bgColor: '#F0FDF4', textColor: '#15803D' },
  { key: 'inactive',      label: 'Inactive',      color: '#6B7280', bgColor: '#F9FAFB', textColor: '#4B5563' },
] as const

export const STUDENT_STAGES = [
  { key: 'lead',             label: 'Lead',             color: '#6366F1', bgColor: '#EEF2FF', textColor: '#4338CA' },
  { key: 'demo_scheduled',   label: 'Demo Scheduled',   color: '#8B5CF6', bgColor: '#F5F3FF', textColor: '#7C3AED' },
  { key: 'demo_done',        label: 'Demo Done',        color: '#F97316', bgColor: '#FFF7ED', textColor: '#C2410C' },
  { key: 'proposal_sent',    label: 'Proposal Sent',    color: '#EAB308', bgColor: '#FEFCE8', textColor: '#A16207' },
  { key: 'negotiating',      label: 'Negotiating',      color: '#D946EF', bgColor: '#FDF4FF', textColor: '#A21CAF' },
  { key: 'enrolled',         label: 'Enrolled',         color: '#06B6D4', bgColor: '#ECFEFF', textColor: '#0E7490' },
  { key: 'active',           label: 'Active ✓',         color: '#16A34A', bgColor: '#F0FDF4', textColor: '#15803D' },
  { key: 'completed',        label: 'Completed',        color: '#2563EB', bgColor: '#EFF6FF', textColor: '#1D4ED8' },
  { key: 'dropped',          label: 'Dropped',          color: '#DC2626', bgColor: '#FEF2F2', textColor: '#B91C1C' },
  { key: 'lost',             label: 'Lost',             color: '#6B7280', bgColor: '#F9FAFB', textColor: '#4B5563' },
] as const

export const TASK_PRIORITIES = [
  { key: 'urgent', label: 'Urgent', color: '#B91C1C', bgColor: '#FEF2F2', dotColor: '#DC2626' },
  { key: 'high',   label: 'High',   color: '#A16207', bgColor: '#FEFCE8', dotColor: '#EAB308' },
  { key: 'medium', label: 'Medium', color: '#1D4ED8', bgColor: '#EFF6FF', dotColor: '#3B82F6' },
  { key: 'low',    label: 'Low',    color: '#4B5563', bgColor: '#F9FAFB', dotColor: '#9CA3AF' },
] as const

export const NAV_ITEMS = [
  { section: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  ]},
  { section: 'Pipeline', items: [
    { href: '/mentors',  label: 'Mentors',  icon: 'Users'        },
    { href: '/students', label: 'Students', icon: 'GraduationCap'},
    { href: '/sessions', label: 'Sessions', icon: 'Video'        },
  ]},
  { section: 'Work', items: [
    { href: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
  ]},
  { section: 'Team', items: [
    { href: '/team',     label: 'Team',     icon: 'Shield'   },
    { href: '/settings', label: 'Settings', icon: 'Settings' },
  ]},
]
