// ── Enums ─────────────────────────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'INTERN'
export type Squad = 'TECH' | 'OUTREACH' | 'CONTENT' | 'PRODUCT' | 'HR_DESIGN'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PROBATION' | 'ALUMNI'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'
export type OutreachType = 'MENTOR' | 'STUDENT'
export type Channel = 'WHATSAPP' | 'LINKEDIN' | 'INSTAGRAM' | 'EMAIL'
export type OutreachStatus = 'NOT_CONTACTED' | 'CONTACTED' | 'INTERESTED' | 'SIGNED_UP' | 'REJECTED'
export type ContentType = 'LINKEDIN_POST' | 'INSTAGRAM_REEL' | 'BLOG' | 'CAROUSEL' | 'VIDEO'
export type ContentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED'

// ── Auth ─────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole
  squad?: Squad | null
  college?: string | null
  yearOfStudy?: number | null
  status: UserStatus
  lorEligible: boolean
  managerId?: string | null
  avatarUrl?: string | null
  repoLink?: string | null
  githubUsername?: string | null
  joinDate: string
  createdAt: string
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

export interface Mentor {
  id: string
  name: string
  email: string
  phone: string | null
  linkedin: string | null
  company: string | null
  domain: MentorDomain | null
  squad?: Squad | null
  source: string | null
  stage: MentorStage
  status: 'active' | 'inactive' | 'blacklisted'
  notes: string | null
  assignedToId: string | null
  assignedTo?: AuthUser | null
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
  phone?: string | null
  parentName?: string | null
  grade?: string | null
  collegeName?: string | null
  branch?: string | null
  graduationYear?: number | null
  squad?: Squad | null
  stage: StudentStage
  assignedToId?: string | null
  assignedTo?: AuthUser | null
  notes?: string | null
  source?: string | null
  createdAt: string
  updatedAt: string
}


// ── Session ──────────────────────────────────────────────────
export interface Session {
  id: string
  mentorId?: string | null
  studentId?: string | null
  mentor?: Mentor | null
  student?: Student | null
  scheduledAt: string
  durationMinutes?: number | null
  type?: string | null
  format?: string | null
  rating?: number | null
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string | null
  createdAt: string
  updatedAt: string
}

// ── Task ─────────────────────────────────────────────────────
export interface Task {
  id: string
  title: string
  description?: string | null
  squad: Squad
  assignedById: string
  assignedBy?: AuthUser
  assignedToId: string
  assignedTo?: AuthUser
  priority: Priority
  status: TaskStatus
  dueDate: string
  proofLink?: string | null
  feedback?: string | null
  points: number
  createdAt: string
  updatedAt: string
}

// ── Performance ──────────────────────────────────────────────
export interface Performance {
  id: string
  internId: string
  intern?: AuthUser
  month: number
  year: number
  tasksAssigned: number
  tasksCompleted: number
  tasksMissed: number
  managerRating?: number | null
  totalScore?: number | null
  lorScore?: number | null
  createdAt: string
}

// ── Outreach ─────────────────────────────────────────────────
export interface OutreachContact {
  id: string
  type: OutreachType
  name: string
  college?: string | null
  linkedinUrl?: string | null
  contactedById: string
  contactedBy?: AuthUser
  channel: Channel
  status: OutreachStatus
  followupDate?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

// ── Content ──────────────────────────────────────────────────
export interface ContentPiece {
  id: string
  title: string
  type: ContentType
  assignedToId: string
  assignedTo?: AuthUser
  status: ContentStatus
  platform?: string | null
  publishedUrl?: string | null
  dueDate: string
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
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

// ── API Helpers ──────────────────────────────────────────────
export interface PaginationMeta { total: number; page: number; limit: number; hasMore: boolean }
export interface ApiResponse<T> { data: T; meta?: PaginationMeta }
