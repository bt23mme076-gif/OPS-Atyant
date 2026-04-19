// ── Auth ─────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'admin' | 'sales' | 'content' | 'outreach' | 'viewer'
export type UserStatus = 'active' | 'deactivated'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  avatarUrl?: string | null
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
}

export interface LoginRequest { email: string; password: string }
export interface LoginResponse { token: string; user: AuthUser }

// ── Mentor ───────────────────────────────────────────────────
export type MentorStage =
  | 'identified'
  | 'outreach_sent'
  | 'call_scheduled'
  | 'call_done'
  | 'profile_setup'
  | 'live'
  | 'inactive'

export type MentorDomain =
  | 'swe' | 'product' | 'data' | 'design' | 'finance'
  | 'core_engineering' | 'marketing' | 'operations' | 'other'

export type MentorStatus = 'active' | 'inactive' | 'blacklisted'

export interface Mentor {
  id: string
  name: string
  email: string
  phone: string | null
  linkedin: string | null
  company: string | null
  domain: MentorDomain | null
  source: string | null
  stage: MentorStage
  status: MentorStatus
  notes: string | null
  assignedToId: string | null
  assignedTo: AuthUser | null
  createdAt: string
  updatedAt: string
  // Legacy specific
  legacyEducation?: any[]
  services?: { video: boolean; audio: boolean; chat: boolean }
}

// ── Student ──────────────────────────────────────────────────
export type StudentStage =
  | 'lead' | 'demo_scheduled' | 'demo_done' | 'proposal_sent'
  | 'negotiating' | 'enrolled' | 'active' | 'completed' | 'dropped' | 'lost'

export interface Student {
  id: string
  name: string
  email: string
  parentName?: string | null
  phone?: string | null
  grade?: string | null
  source?: string | null
  stage: StudentStage
  assignedToId?: string | null
  assignedTo?: AuthUser | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

// ── Session ──────────────────────────────────────────────────
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type SessionType = 'trial' | 'regular' | 'makeup'
export type SessionFormat = 'online' | 'offline'

export interface Session {
  id: string
  studentId: string
  mentorId: string
  student?: Student
  mentor?: Mentor
  type: SessionType
  format: SessionFormat
  status: SessionStatus
  scheduledAt: string
  durationMin: number
  meetLink?: string | null
  rating?: number | null
  notes?: string | null
  createdAt: string
}

// ── Task ─────────────────────────────────────────────────────
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  assignedToId?: string | null
  assignedTo?: AuthUser | null
  mentorId?: string | null
  studentId?: string | null
  dueAt?: string | null
  completedAt?: string | null
  createdById: string
  createdAt: string
  updatedAt: string
}

// ── Dashboard ────────────────────────────────────────────────
export interface DashboardStats {
  totalMentors: number
  activeMentors: number
  totalStudents: number
  activeStudents: number
  sessionsThisWeek: number
  pendingTasks: number
  conversionRate: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: string
  description: string
  createdAt: string
  user?: AuthUser
}

// ── Notification ─────────────────────────────────────────────
export interface Notification {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
}

// ── Pagination ───────────────────────────────────────────────
export interface PaginationMeta { total: number; page: number; limit: number; hasMore: boolean }
export interface ApiResponse<T> { data: T; meta?: PaginationMeta }
