'use client'
import { useState } from 'react'
import { Plus, RefreshCw, UserX, UserCheck, Mail, Clock, CheckCircle, XCircle, Trash2, Send } from 'lucide-react'
import {
  useGetUsersQuery, useGetPendingInvitesQuery,
  useInviteUserMutation, useDeactivateUserMutation,
  useReactivateUserMutation, useRevokeInviteMutation,
} from '@/store/api/usersApi'
import { Button, Badge, Avatar, Modal, Spinner, Empty } from '@/components/ui'
import { formatRelative, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: '#FEF2F2', color: '#B91C1C' },
  admin:       { bg: '#EFF6FF', color: '#1D4ED8' },
  sales:       { bg: '#F0FDF4', color: '#15803D' },
  content:     { bg: '#FDF4FF', color: '#7C3AED' },
  outreach:    { bg: '#FFF7ED', color: '#C2410C' },
  viewer:      { bg: '#F9FAFB', color: '#4B5563' },
}

const INVITE_STATUS = {
  pending:  { icon: Clock,        color: 'text-amber-500',  bg: '#FFFBEB', text: '#92400E', label: 'Pending'  },
  accepted: { icon: CheckCircle,  color: 'text-green-500',  bg: '#F0FDF4', text: '#15803D', label: 'Accepted' },
  expired:  { icon: XCircle,      color: 'text-gray-400',   bg: '#F9FAFB', text: '#4B5563', label: 'Expired'  },
}

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [invite, { isLoading }] = useInviteUserMutation()
  const [email, setEmail] = useState('')
  const [role, setRole]   = useState('sales')

  async function submit() {
    if (!email.trim()) return
    try {
      await invite({ email: email.toLowerCase().trim(), role }).unwrap()
      toast.success(`Invite sent to ${email}`)
      onClose()
      setEmail('')
    } catch { toast.error('Failed to send invite') }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Team Member">
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
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            {[
              ['admin',    'Admin — full access except managing other admins'],
              ['sales',    'Sales — pipeline cards assigned to them'],
              ['content',  'Content — answer cards, success stories'],
              ['outreach', 'Outreach — mentor recruitment, student outreach'],
              ['viewer',   'Viewer — read only across all modules'],
            ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
          <p className="text-xs text-blue-700">
            An invite link valid for <strong>7 days</strong> will be sent to this email.
            They'll set their own name and password when accepting.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={submit}>
            <Send size={13} /> Send Invite
          </Button>
        </div>
      </div>
    </Modal>
  )
}

type Tab = 'members' | 'invites'

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('members')

  const { data: users = [],   isLoading: loadingUsers,   refetch: refetchUsers }   = useGetUsersQuery()
  const { data: invites = [],  isLoading: loadingInvites, refetch: refetchInvites } = useGetPendingInvitesQuery()
  const [deactivate]  = useDeactivateUserMutation()
  const [reactivate]  = useReactivateUserMutation()
  const [revokeInvite] = useRevokeInviteMutation()

  const pendingCount = invites.filter(i => i.status === 'pending').length

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? They won't be able to log in.`)) return
    try { await deactivate(id).unwrap(); toast.success('User deactivated') }
    catch { toast.error('Failed to deactivate') }
  }

  async function handleRevoke(id: string, email: string) {
    if (!confirm(`Revoke invite for ${email}?`)) return
    try { await revokeInvite(id).unwrap(); toast.success('Invite revoked') }
    catch { toast.error('Failed to revoke') }
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.filter(u => u.status === 'active').length} active ·{' '}
            {pendingCount > 0 && <span className="text-amber-600 font-medium">{pendingCount} invite{pendingCount > 1 ? 's' : ''} pending</span>}
            {pendingCount === 0 && 'no pending invites'}
          </p>
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

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-5">
        {([
          ['members', 'Members', users.length],
          ['invites',  'Invites',  invites.length],
        ] as [Tab, string, number][]).map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}>
            {label}
            {count > 0 && (
              <span className={cn('ml-2 text-[11px] font-bold rounded-full px-1.5 py-0.5',
                tab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        loadingUsers ? <div className="flex justify-center py-16"><Spinner /></div> :
        users.length === 0 ? <Empty title="No team members" description="Invite your team to get started" /> : (
          <>
            {/* Desktop table */}
            <div className="card overflow-hidden hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Member', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const roleStyle = ROLE_COLORS[u.role] ?? ROLE_COLORS.viewer
                    return (
                      <tr key={u.id} className={cn('border-b border-gray-50 hover:bg-gray-50/70 transition-colors', i === users.length - 1 && 'border-0')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} size={32} bg={u.status === 'active' ? '#2563EB' : '#9CA3AF'} />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge bgColor={roleStyle.bg} textColor={roleStyle.color} className="capitalize">
                            {u.role.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={cn('w-1.5 h-1.5 rounded-full', u.status === 'active' ? 'bg-green-500' : 'bg-gray-300')} />
                            <span className={cn('text-xs font-medium capitalize', u.status === 'active' ? 'text-green-700' : 'text-gray-400')}>
                              {u.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {(u as any).joinedAt ? formatRelative((u as any).joinedAt) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {u.role !== 'super_admin' && (
                            u.status === 'active'
                              ? <Button variant="ghost" size="xs" onClick={() => handleDeactivate(u.id, u.name)}>
                                  <UserX size={12} /> Deactivate
                                </Button>
                              : <Button variant="ghost" size="xs" onClick={() => reactivate(u.id)}>
                                  <UserCheck size={12} /> Reactivate
                                </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {users.map(u => {
                const roleStyle = ROLE_COLORS[u.role] ?? ROLE_COLORS.viewer
                return (
                  <div key={u.id} className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={u.name} size={36} bg={u.status === 'active' ? '#2563EB' : '#9CA3AF'} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', u.status === 'active' ? 'bg-green-500' : 'bg-gray-300')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge bgColor={roleStyle.bg} textColor={roleStyle.color} className="capitalize text-[11px]">
                        {u.role.replace('_', ' ')}
                      </Badge>
                      {u.role !== 'super_admin' && (
                        u.status === 'active'
                          ? <Button variant="ghost" size="xs" onClick={() => handleDeactivate(u.id, u.name)}>
                              <UserX size={12} /> Deactivate
                            </Button>
                          : <Button variant="ghost" size="xs" onClick={() => reactivate(u.id)}>
                              <UserCheck size={12} /> Reactivate
                            </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      )}

      {/* Invites tab */}
      {tab === 'invites' && (
        loadingInvites ? <div className="flex justify-center py-16"><Spinner /></div> :
        invites.length === 0 ? (
          <Empty icon={<Mail size={32} />} title="No invites sent yet" description="Invite team members using the button above" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="card overflow-hidden hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Email', 'Role', 'Status', 'Sent', 'Expires', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv, i) => {
                    const statusInfo = INVITE_STATUS[inv.status] ?? INVITE_STATUS.pending
                    const StatusIcon = statusInfo.icon
                    const roleStyle = ROLE_COLORS[inv.role] ?? ROLE_COLORS.viewer
                    return (
                      <tr key={inv.id} className={cn('border-b border-gray-50 hover:bg-gray-50/70', i === invites.length - 1 && 'border-0')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Mail size={13} className="text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-700">{inv.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge bgColor={roleStyle.bg} textColor={roleStyle.color} className="capitalize">{inv.role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon size={13} className={statusInfo.color} />
                            <span className="text-xs font-medium" style={{ color: statusInfo.text }}>{statusInfo.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatRelative(inv.createdAt)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {inv.status === 'accepted' ? (
                            <span className="text-green-600">Accepted {inv.acceptedAt ? formatRelative(inv.acceptedAt) : ''}</span>
                          ) : (
                            formatRelative(inv.expiresAt)
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {inv.status === 'pending' && (
                            <Button variant="ghost" size="xs" onClick={() => handleRevoke(inv.id, inv.email)}>
                              <Trash2 size={12} /> Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {invites.map(inv => {
                const statusInfo = INVITE_STATUS[inv.status] ?? INVITE_STATUS.pending
                const StatusIcon = statusInfo.icon
                const roleStyle = ROLE_COLORS[inv.role] ?? ROLE_COLORS.viewer
                return (
                  <div key={inv.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Sent {formatRelative(inv.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon size={13} className={statusInfo.color} />
                        <span className="text-xs font-medium" style={{ color: statusInfo.text }}>{statusInfo.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge bgColor={roleStyle.bg} textColor={roleStyle.color} className="capitalize text-[11px]">{inv.role}</Badge>
                      {inv.status === 'pending' && (
                        <Button variant="ghost" size="xs" onClick={() => handleRevoke(inv.id, inv.email)}>
                          <Trash2 size={12} /> Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}