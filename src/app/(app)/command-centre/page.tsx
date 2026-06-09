'use client'
import { useState, useMemo } from 'react'
import {
  Users, CheckSquare, TrendingUp, AlertTriangle, Target,
  Plus, RefreshCw, UserX, UserCheck, Search, Filter,
  BarChart2, Zap, Shield, Code2, Megaphone, FileText, Copy, Phone, Linkedin, ExternalLink,
} from 'lucide-react'
import {
  useGetUsersQuery, useGetPendingInvitesQuery,
  useUpdateUserMutation, useRevokeInviteMutation,
  useInviteUserMutation,
} from '@/store/api/usersApi'
import { useGetTasksQuery } from '@/store/api/tasksApi'
import { Avatar, Badge, Button, Spinner, Modal } from '@/components/ui'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { AuthUser, Task } from '@/types'

// ── Palette ──────────────────────────────────────────────────────────────────
const BRAND   = '#2563EB'
const SUCCESS = '#16A34A'
const WARN    = '#D97706'
const DANGER  = '#DC2626'
const PURPLE  = '#7C3AED'
const CYAN    = '#0891B2'

// ── Squad config ─────────────────────────────────────────────────────────────
const SQUADS = [
  { id: 'TECH',      label: 'Tech',      icon: Code2,     color: BRAND   },
  { id: 'OUTREACH',  label: 'Outreach',  icon: Megaphone, color: PURPLE  },
  { id: 'CONTENT',   label: 'Content',   icon: FileText,  color: CYAN    },
  { id: 'PRODUCT',   label: 'Product',   icon: Target,    color: WARN    },
  { id: 'HR_DESIGN', label: 'HR/Design', icon: Shield,    color: SUCCESS },
  { id: 'CBM',       label: 'Campus Brand Manager', icon: Megaphone, color: '#EC4899' },
] as const

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', bg: '#FEF2F2', color: '#B91C1C' },
  MANAGER:     { label: 'Manager',     bg: '#EFF6FF', color: '#1D4ED8' },
  INTERN:      { label: 'Intern',      bg: '#F0FDF4', color: '#15803D' },
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE:    { label: 'Active',    color: '#15803D', dot: '#16A34A' },
  INACTIVE:  { label: 'Inactive',  color: '#6B7280', dot: '#9CA3AF' },
  PROBATION: { label: 'Probation', color: '#92400E', dot: '#D97706' },
  ALUMNI:    { label: 'Alumni',    color: '#1D4ED8', dot: '#3B82F6' },
}

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 75) return SUCCESS
  if (s >= 50) return WARN
  return DANGER
}

function calcScore(user: AuthUser, tasks: Task[]) {
  const mine = tasks.filter(t => t.assignedToId === user.id)
  if (!mine.length) return 0
  const done = mine.filter(t => t.status === 'DONE').length
  return Math.round((done / mine.length) * 100)
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ height: 5, background: '#E2E8F0', borderRadius: 9, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${score}%`, borderRadius: 9,
        background: scoreColor(score), transition: 'width 0.6s ease',
      }} />
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="card card-hover p-5 flex items-center gap-4">
      <div style={{ width: 42, height: 42, borderRadius: 10, background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [invite, { isLoading }] = useInviteUserMutation()
  const [email, setEmail] = useState('')
  const [role, setRole]   = useState('INTERN')
  const [squad, setSquad] = useState('')

  function reset() { setEmail(''); setRole('INTERN'); setSquad('') }

  async function submit() {
    if (!email.trim()) return
    const body: { email: string; role: string; squad?: string } = {
      email: email.toLowerCase().trim(), role,
    }
    if (role === 'INTERN' && squad) body.squad = squad
    try {
      await invite(body).unwrap()
      toast.success(`Invite sent to ${email}`)
      reset(); onClose()
    } catch { toast.error('Failed to send invite') }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Invite Team Member">
      <div className="space-y-4">
        <div>
          <label className="label block mb-1.5">Email address *</label>
          <input className="input" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="teammate@atyant.in" autoFocus />
        </div>

        <div>
          <label className="label block mb-1.5">Role</label>
          <select className="input" value={role} onChange={e => { setRole(e.target.value); setSquad('') }}>
            {[
              ['SUPER_ADMIN', 'Super Admin — full access'],
              ['MANAGER',     'Manager — manage interns & tasks'],
              ['INTERN',      'Intern — standard access'],
            ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {/* Squad — only relevant for interns */}
        {role === 'INTERN' && (
          <div>
            <label className="label block mb-1.5">
              Squad <span className="text-gray-400 font-normal">(sub-team)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SQUADS.map(sq => {
                const Icon = sq.icon
                const active = squad === sq.id
                return (
                  <button key={sq.id} type="button" onClick={() => setSquad(active ? '' : sq.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all"
                    style={{
                      borderColor: active ? sq.color : '#E2E8F0',
                      background:  active ? sq.color + '15' : '#FAFAFA',
                      color:       active ? sq.color : '#6B7280',
                    }}>
                    <Icon size={13} />
                    {sq.label}
                    {active && <span className="ml-auto text-[10px]">✓</span>}
                  </button>
                )
              })}
            </div>
            {!squad && (
              <p className="text-[11px] text-gray-400 mt-1.5">Optional — can be assigned later</p>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
          <p className="text-xs text-blue-700">
            An invite link valid for <strong>7 days</strong> will be sent to this email.
            {role === 'INTERN' && squad && (
              <> They'll be added to the <strong>{SQUADS.find(s => s.id === squad)?.label}</strong> squad.</>
            )}
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={() => { reset(); onClose() }}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={submit}>Send Invite</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type View = 'overview' | 'team'

export default function CommandCentrePage() {
  const [view, setView] = useState<View>('overview')
  const [search, setSearch] = useState('')
  const [filterSquad, setFilterSquad] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)

  const { data: users = [],  isLoading: loadingUsers,  refetch: refetchUsers  } = useGetUsersQuery()
  const { data: invites = [], refetch: refetchInvites } = useGetPendingInvitesQuery()
  const { data: tasks = [],   isLoading: loadingTasks  } = useGetTasksQuery()

  const [updateUser]   = useUpdateUserMutation()
  const [revokeInvite] = useRevokeInviteMutation()

  // ── derived stats ──────────────────────────────────────────────────────────
  const activeCount   = users.filter(u => u.status === 'ACTIVE').length
  const probationCount = users.filter(u => u.status === 'PROBATION').length
  const totalTasks    = tasks.length
  const doneTasks     = tasks.filter(t => t.status === 'DONE').length
  const pendingTasks  = tasks.filter(t => ['TODO','IN_PROGRESS'].includes(t.status)).length

  const avgScore = useMemo(() => {
    if (!users.length) return 0
    const scores = users.map(u => calcScore(u, tasks))
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [users, tasks])

  // ── filtered members ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      const matchSquad  = filterSquad === 'all' || u.squad === filterSquad
      const matchRole   = filterRole  === 'all' || u.role  === filterRole
      return matchSearch && matchSquad && matchRole
    })
  }, [users, search, filterSquad, filterRole])

  // ── actions ────────────────────────────────────────────────────────────────
  async function handleStatusChange(id: string, name: string, newStatus: string) {
    const labels: Record<string, string> = {
      INACTIVE: 'Deactivate',
      ACTIVE: 'Reactivate',
      PROBATION: 'Set Probation',
    }
    const verb = labels[newStatus] ?? 'Update'
    if (!confirm(`${verb} ${name}?`)) return
    try {
      await updateUser({ id, data: { status: newStatus } }).unwrap()
      toast.success(`${name} status updated`)
    } catch { toast.error('Failed to update status') }
  }

  async function handleSquadChange(id: string, name: string, newSquad: string) {
    try {
      await updateUser({ id, data: { squad: newSquad } }).unwrap()
      toast.success(`${name} moved to ${SQUADS.find(s => s.id === newSquad)?.label}`)
    } catch { toast.error('Failed to update squad') }
  }

  async function handleRevoke(id: string, email: string) {
    if (!confirm(`Revoke invite for ${email}?`)) return
    try { await revokeInvite(id).unwrap(); toast.success('Invite revoked') }
    catch { toast.error('Failed to revoke') }
  }

  if (loadingUsers || loadingTasks) {
    return <div className="flex items-center justify-center h-64"><Spinner size={28} /></div>
  }

  return (
    <div className="max-w-6xl">
      {/* ── Top nav tabs ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden bg-white">
          {([
            ['overview', 'Overview', BarChart2],
            ['team',     'Team',     Users],
          ] as [View, string, React.ComponentType<{size?: number}>][]).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setView(key)}
              className={cn('flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all',
                view === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              )}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { refetchUsers(); refetchInvites() }}>
            <RefreshCw size={13} />
          </Button>
          <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
            <Plus size={13} /> Invite Member
          </Button>
        </div>
      </div>

      {/* ── OVERVIEW ────────────────────────────────────────────────────────── */}
      {view === 'overview' && (
        <div>
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Command Centre</h1>
            <p className="text-sm text-gray-500 mt-0.5">Real-time view of Atyant team execution</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            <StatCard icon={<Users size={18} />}       label="Total Members"  value={users.length}   sub="Across all squads" color={BRAND}   />
            <StatCard icon={<Zap size={18} />}         label="Active"         value={activeCount}    sub="Executing now"     color={SUCCESS} />
            <StatCard icon={<AlertTriangle size={18}/>} label="On Probation"  value={probationCount} sub="Needs attention"   color={WARN}    />
            <StatCard icon={<CheckSquare size={18} />}  label="Tasks Done"    value={`${doneTasks}/${totalTasks}`} sub={`${pendingTasks} pending`} color={PURPLE} />
            <StatCard icon={<TrendingUp size={18} />}   label="Avg. Score"    value={`${avgScore}%`} sub="Task completion"   color={scoreColor(avgScore)} />
          </div>

          {/* Squad breakdown */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Squad Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SQUADS.map(sq => {
                const Icon = sq.icon
                const sqMembers = users.filter(u => u.squad === sq.id)
                const sqTasks   = tasks.filter(t => t.squad  === sq.id)
                const sqDone    = sqTasks.filter(t => t.status === 'DONE').length
                const sqScore   = sqMembers.length
                  ? Math.round(sqMembers.map(u => calcScore(u, tasks)).reduce((a, b) => a + b, 0) / sqMembers.length)
                  : 0
                return (
                  <div key={sq.id} className="card p-4" style={{ borderLeft: `3px solid ${sq.color}` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 font-semibold text-sm text-gray-800">
                        <Icon size={15} style={{ color: sq.color }} />
                        {sq.label}
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: sq.color + '18', color: sq.color }}>
                        {sqMembers.length} people
                      </span>
                    </div>
                    <ScoreBar score={sqScore} />
                    <div className="flex justify-between mt-2 text-[11px] text-gray-400">
                      <span>Avg: <span className="font-semibold" style={{ color: scoreColor(sqScore) }}>{sqScore}%</span></span>
                      <span>Tasks: {sqDone}/{sqTasks.length}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Probation / at-risk members */}
          {probationCount > 0 && (
            <div className="rounded-lg p-4 mb-6" style={{ background: WARN + '10', border: `1px solid ${WARN}33` }}>
              <div className="font-semibold text-sm mb-3" style={{ color: WARN }}>
                ⚠️ On Probation — Needs Attention
              </div>
              <div className="flex flex-wrap gap-2">
                {users.filter(u => u.status === 'PROBATION').map(u => {
                  const score = calcScore(u, tasks)
                  return (
                    <div key={u.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-sm">
                      <Avatar name={u.name} size={22} bg={WARN} />
                      <span className="font-medium text-gray-800">{u.name}</span>
                      <span className="text-gray-400 text-xs">{u.role}</span>
                      <span className="text-xs font-bold" style={{ color: scoreColor(score) }}>{score}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pending invites notice */}
          {invites.filter(i => i.status === 'pending').length > 0 && (
            <div className="rounded-lg p-4 flex items-center justify-between" style={{ background: BRAND + '08', border: `1px solid ${BRAND}22` }}>
              <p className="text-sm text-blue-700">
                <strong>{invites.filter(i => i.status === 'pending').length}</strong> pending invite{invites.filter(i => i.status === 'pending').length > 1 ? 's' : ''} waiting for acceptance.
              </p>
              <button onClick={() => setView('team')} className="text-xs font-medium text-blue-600 hover:underline">
                View Team →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TEAM ────────────────────────────────────────────────────────────── */}
      {view === 'team' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
              <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {users.length} shown</p>
            </div>
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name or email…"
                  className="input pl-7" style={{ width: 180, fontSize: 13, padding: '7px 10px 7px 28px' }} />
              </div>
              <select value={filterSquad} onChange={e => setFilterSquad(e.target.value)}
                className="input" style={{ fontSize: 13, padding: '7px 10px', width: 'auto' }}>
                <option value="all">All Squads</option>
                {SQUADS.map(sq => <option key={sq.id} value={sq.id}>{sq.label}</option>)}
              </select>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className="input" style={{ fontSize: 13, padding: '7px 10px', width: 'auto' }}>
                <option value="all">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="INTERN">Intern</option>
              </select>
              {(search || filterSquad !== 'all' || filterRole !== 'all') && (
                <button onClick={() => { setSearch(''); setFilterSquad('all'); setFilterRole('all') }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded border border-gray-200 bg-white transition-colors">
                  <Filter size={11} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Member cards */}
          {filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Users size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-medium">No members match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(u => {
                const roleMeta   = ROLE_META[u.role]   ?? ROLE_META.INTERN
                const statusMeta = STATUS_META[u.status] ?? STATUS_META.INACTIVE
                const squad      = SQUADS.find(s => s.id === u.squad)
                const score      = calcScore(u, tasks)
                const uTasks     = tasks.filter(t => t.assignedToId === u.id)
                const uDone      = uTasks.filter(t => t.status === 'DONE').length
                const isInactive = u.status === 'INACTIVE'
                const SquadIcon  = squad?.icon

                return (
                  <div key={u.id} className="card card-hover p-4"
                    style={{ borderTop: `3px solid ${squad?.color ?? '#E2E8F0'}`, opacity: isInactive ? 0.55 : 1 }}>
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size={34}
                           bg={u.status === 'ACTIVE' ? (squad?.color ?? BRAND) : '#94A3B8'} />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{u.name}</p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[130px]">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {/* Role badge — if intern, show squad as sub-label */}
                        {u.role === 'INTERN' && squad ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <Badge bgColor={roleMeta.bg} textColor={roleMeta.color}>
                              {roleMeta.label}
                            </Badge>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: squad.color + '18', color: squad.color }}>
                              {squad.label}
                            </span>
                          </div>
                        ) : (
                          <Badge bgColor={roleMeta.bg} textColor={roleMeta.color}>{roleMeta.label}</Badge>
                        )}
                        <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: statusMeta.color }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusMeta.dot, display: 'inline-block' }} />
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-gray-400">Task Completion</span>
                        <span className="font-bold font-mono" style={{ color: scoreColor(score) }}>{score}%</span>
                      </div>
                      <ScoreBar score={score} />
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        {SquadIcon && <SquadIcon size={11} style={{ color: squad?.color }} />}
                        <span style={{ color: squad?.color ?? '#6B7280', fontWeight: 600 }}>
                          {squad?.label ?? 'No Squad'}
                        </span>
                      </span>
                      <span>Tasks: <span className="text-gray-600 font-medium">{uDone}/{uTasks.length}</span></span>
                    </div>

                    {/* Contact Info Section - visible to managers/admins */}
                    {u.role === 'INTERN' && (u.whatsappNumber || u.linkedinUrl || u.repoLink) && (
                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                        {u.whatsappNumber && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Phone size={11} className="text-green-500" /> WhatsApp
                            </span>
                            <a
                              href={`https://wa.me/${u.whatsappNumber.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 font-semibold hover:underline"
                            >
                              {u.whatsappNumber}
                            </a>
                          </div>
                        )}
                        {u.linkedinUrl && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Linkedin size={11} className="text-blue-600" /> LinkedIn
                            </span>
                            <a
                              href={u.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
                            >
                              View Profile <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                        {u.repoLink && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Code2 size={11} className="text-gray-400" /> Repo
                            </span>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={u.repoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 font-semibold hover:underline"
                              >
                                View Repo
                              </a>
                              <button
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(u.repoLink || '')
                                    toast.success('Repo link copied!')
                                  } catch {
                                    toast.error('Failed to copy')
                                  }
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded hover:bg-gray-100"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {u.role !== 'SUPER_ADMIN' && (
                      <div className="pt-2 border-t border-gray-50 space-y-2">
                        {/* Status actions */}
                        <div className="flex gap-1.5 flex-wrap">
                          {u.status !== 'ACTIVE' && (
                            <button onClick={() => handleStatusChange(u.id, u.name, 'ACTIVE')}
                              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border transition-all"
                              style={{ borderColor: SUCCESS + '44', background: SUCCESS + '10', color: SUCCESS }}>
                              <UserCheck size={10} /> Activate
                            </button>
                          )}
                          {u.status !== 'INACTIVE' && (
                            <button onClick={() => handleStatusChange(u.id, u.name, 'INACTIVE')}
                              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border transition-all"
                              style={{ borderColor: '#9CA3AF44', background: '#F9FAFB', color: '#6B7280' }}>
                              <UserX size={10} /> Deactivate
                            </button>
                          )}
                          {u.status !== 'PROBATION' && (
                            <button onClick={() => handleStatusChange(u.id, u.name, 'PROBATION')}
                              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border transition-all"
                              style={{ borderColor: WARN + '44', background: WARN + '10', color: WARN }}>
                              <AlertTriangle size={10} /> Probation
                            </button>
                          )}
                        </div>
                        {/* Squad change — for interns and managers */}
                        {(u.role === 'INTERN' || u.role === 'MANAGER') && (
                          <div>
                            <p className="text-[10px] text-gray-400 mb-1">Move to squad:</p>
                            <div className="flex gap-1 flex-wrap">
                              {SQUADS.filter(sq => sq.id !== u.squad).map(sq => {
                                const Icon = sq.icon
                                return (
                                  <button key={sq.id} onClick={() => handleSquadChange(u.id, u.name, sq.id)}
                                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-all"
                                    style={{ borderColor: sq.color + '44', background: sq.color + '10', color: sq.color }}>
                                    <Icon size={9} /> {sq.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {/* Role change — toggle between MANAGER and INTERN */}
                        {(u.role === 'INTERN' || u.role === 'MANAGER') && (
                          <div>
                            <p className="text-[10px] text-gray-400 mb-1">Change role:</p>
                            <div className="flex gap-1">
                              {u.role === 'INTERN' ? (
                                <button
                                  onClick={() => {
                                    if (!confirm(`Promote ${u.name} to Manager?`)) return
                                    updateUser({ id: u.id, data: { role: 'MANAGER' } }).unwrap()
                                      .then(() => toast.success(`${u.name} promoted to Manager`))
                                      .catch(() => toast.error('Failed to update role'))
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-all"
                                  style={{ borderColor: '#1D4ED844', background: '#EFF6FF', color: '#1D4ED8' }}>
                                  ↑ Promote to Manager
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!confirm(`Demote ${u.name} to Intern?`)) return
                                    updateUser({ id: u.id, data: { role: 'INTERN' } }).unwrap()
                                      .then(() => toast.success(`${u.name} changed to Intern`))
                                      .catch(() => toast.error('Failed to update role'))
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-all"
                                  style={{ borderColor: '#15803D44', background: '#F0FDF4', color: '#15803D' }}>
                                  ↓ Change to Intern
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pending invites section */}
          {invites.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Pending Invites ({invites.filter(i => i.status === 'pending').length})</h2>
              <div className="card overflow-x-auto whitespace-nowrap">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Email', 'Role', 'Status', 'Expires', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv, i) => {
                      const rm = ROLE_META[inv.role] ?? ROLE_META.INTERN
                      const statusColor = inv.status === 'accepted' ? '#15803D' : inv.status === 'expired' ? '#6B7280' : '#92400E'
                      return (
                        <tr key={inv.id} className={cn('border-b border-gray-50 hover:bg-gray-50/50 transition-colors', i === invites.length - 1 && 'border-0')}>
                          <td className="px-4 py-2.5 text-gray-700 text-xs">{inv.email}</td>
                          <td className="px-4 py-2.5">
                            <Badge bgColor={rm.bg} textColor={rm.color}>{rm.label}</Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs font-medium capitalize" style={{ color: statusColor }}>{inv.status}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">
                            {inv.status === 'accepted' ? '—' : new Date(inv.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5">
                            {inv.status === 'pending' && (
                              <Button variant="danger" size="xs" onClick={() => handleRevoke(inv.id, inv.email)}>
                                Revoke
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}
