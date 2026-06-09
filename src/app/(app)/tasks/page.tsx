'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import {
  Plus,
  RefreshCw,
  User,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Sparkles,
  Clock,
  AlertTriangle,
  Copy,
  MessageSquareText,
  ExternalLink,
  Send,
  ClipboardCheck,
} from 'lucide-react'
import {
  useGetTasksQuery,
  useGetMyTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useSendTaskFollowUpMutation,
} from '@/store/api/tasksApi'
import { useGetUsersQuery } from '@/store/api/usersApi'
import { useCurrentUser } from '@/store/hooks'
import { Button, Modal, Spinner, Empty } from '@/components/ui'
import { formatDue, cn } from '@/lib/utils'
import type { TaskStatus, Task } from '@/types'
import toast from 'react-hot-toast'
import { TASK_PRIORITIES, TASK_STATUSES, ROLES, SQUADS } from '@/lib/constants'

const PRIORITY_MAP = Object.fromEntries(TASK_PRIORITIES.map(p => [p.key, p]))

const PRIORITY_BORDER: Record<string, string> = {
  URGENT: 'border-l-red-500 bg-red-50/20',
  HIGH: 'border-l-amber-500 bg-amber-50/20',
  MEDIUM: 'border-l-blue-500 bg-blue-50/20',
  LOW: 'border-l-emerald-500 bg-emerald-50/20',
}

const COLUMNS = TASK_STATUSES.map(s => ({
  ...s,
  bgColor: s.color === '#6B7280' ? '#F3F4F6' : `${s.color}10`,
}))

function isNewTask(task: Task) {
  const createdAt = (task as any)?.createdAt
  if (!createdAt) return false

  const createdTime = new Date(createdAt).getTime()
  if (Number.isNaN(createdTime)) return false

  const hoursOld = (Date.now() - createdTime) / (1000 * 60 * 60)
  return hoursOld <= 24 && task.status !== 'DONE'
}

function getDueBadge(task: Task) {
  const dueDate = (task as any)?.dueDate
  if (!dueDate) return null

  const due = formatDue(dueDate)

  return {
    label: due.label,
    isOverdue: due.isOverdue,
  }
}

function getTaskAssigneeId(task: Task) {
  return (task as any)?.assignedToId ?? (task as any)?.assignedTo?.id ?? ''
}

function getActiveTaskCount(tasks: Task[], userId: string) {
  if (!userId) return 0

  return tasks.filter(task => {
    const assigneeId = getTaskAssigneeId(task)
    return assigneeId === userId && task.status !== 'DONE'
  }).length
}

function getWorkloadMeta(count: number) {
  if (count >= 3) {
    return {
      label: 'Busy',
      dot: 'bg-red-500',
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      emoji: '🔴',
    }
  }

  if (count >= 1) {
    return {
      label: 'Working',
      dot: 'bg-amber-500',
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      emoji: '🟡',
    }
  }

  return {
    label: 'Available',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    emoji: '🟢',
  }
}

const normalize = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')

const getUserId = (user: any) =>
  user.id ?? user._id ?? user.userId ?? ''

const getUserName = (user: any) =>
  user.name ?? user.fullName ?? user.username ?? user.email ?? 'Unnamed User'

const getUserRole = (user: any) =>
  normalize(user.role ?? user.userRole ?? user.type)

const getUserSquad = (user: any) =>
  normalize(user.squad ?? user.team ?? user.department ?? user.category ?? user.domain)

const getSearchText = (user: any) =>
  normalize([
    user.squad,
    user.team,
    user.department,
    user.category,
    user.domain,
    user.role,
    user.userRole,
    user.type,
    user.position,
    user.designation,
    user.title,
    user.name,
    user.fullName,
    user.email
  ].filter(Boolean).join(' '))

const isInternUser = (user: any) => {
  const role = getUserRole(user)
  const text = getSearchText(user)

  return (
    role === normalize(ROLES.INTERN) ||
    role.includes('INTERN') ||
    text.includes('INTERN') ||
    text.includes('STUDENT')
  )
}

const SQUAD_ALIASES: Record<string, string[]> = {
  TECH: [
    'TECH',
    'TECH TEAM',
    'TECHNICAL',
    'TECHNICAL TEAM',
    'WEB DEV',
    'WEBDEV',
    'WEB DEVELOPMENT',
    'DEVELOPER',
    'DEVELOPMENT'
  ],
  OUTREACH: [
    'OUTREACH',
    'OUTREACH TEAM',
    'OUTREACH INTERN',
    'MARKETING',
    'MARKETING TEAM',
    'SALES',
    'SALES TEAM',
    'LEAD',
    'LEADS',
    'LEAD GENERATION',
    'COMMUNITY',
    'PROMOTION',
    'CAMPUS',
    'RELATIONS'
  ],
  CONTENT: [
    'CONTENT',
    'CONTENT TEAM',
    'CONTENT INTERN',
    'WRITER',
    'WRITING',
    'COPYWRITER',
    'COPY WRITER',
    'COPYWRITING',
    'SOCIAL MEDIA',
    'SCRIPT',
    'BLOG',
    'POST',
    'CREATIVE'
  ],
  PRODUCT: [
    'PRODUCT',
    'PRODUCT TEAM',
    'PRODUCT INTERN',
    'PRODUCT STRATEGY',
    'STRATEGY',
    'OPERATIONS',
    'OPS',
    'RESEARCH',
    'ANALYST',
    'BUSINESS',
    'FEATURE'
  ],
  'HR DESIGN': [
    'HR DESIGN',
    'HR',
    'HUMAN RESOURCE',
    'HUMAN RESOURCES',
    'DESIGN',
    'DESIGN TEAM',
    'UI',
    'UX',
    'UI UX',
    'GRAPHIC',
    'GRAPHIC DESIGN',
    'DESIGNER'
  ]
}

const getSquadKey = (value?: string | null) => {
  const selected = normalize(value)

  if (!selected) return ''

  if (selected.includes('HR') && selected.includes('DESIGN')) return 'HR DESIGN'

  const direct = Object.keys(SQUAD_ALIASES).find(key => normalize(key) === selected)

  if (direct) return direct

  const matched = Object.entries(SQUAD_ALIASES).find(([_, aliases]) =>
    aliases.some(alias => selected === normalize(alias) || selected.includes(normalize(alias)))
  )

  return matched?.[0] ?? selected
}

const userMatchesSquad = (user: any, selectedSquad: string) => {
  const squadKey = getSquadKey(selectedSquad)
  const userSquad = getUserSquad(user)
  const userText = getSearchText(user)

  if (!squadKey) return true

  const aliases = SQUAD_ALIASES[squadKey] ?? [squadKey]

  return aliases.some(alias => {
    const normalAlias = normalize(alias)

    return (
      userSquad === normalAlias ||
      userSquad.includes(normalAlias) ||
      userText.includes(normalAlias)
    )
  })
}

function getSubmission(task?: Task) {
  if (!task) {
    return {
      prLink: '',
      docLink: '',
      summary: '',
      blockers: '',
      feedback: '',
      submittedAt: '',
    }
  }

  return {
    prLink: (task as any)?.submissionPrLink ?? (task as any)?.proofLink ?? '',
    docLink: (task as any)?.submissionDocLink ?? '',
    summary: (task as any)?.submissionSummary ?? '',
    blockers: (task as any)?.submissionBlockers ?? '',
    feedback: (task as any)?.reviewFeedback ?? (task as any)?.feedback ?? '',
    submittedAt: (task as any)?.submittedAt ?? '',
  }
}

function hasSubmission(task?: Task) {
  const submission = getSubmission(task)
  return !!(submission.prLink || submission.docLink || submission.summary || submission.blockers)
}

async function copyText(value: string, label = 'Copied') {
  if (!value) {
    toast.error('Nothing to copy')
    return
  }

  try {
    await navigator.clipboard.writeText(value)
    toast.success(label)
  } catch {
    toast.error('Failed to copy')
  }
}

function SubmissionModal({
  open,
  onClose,
  task,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  task: Task
  onSubmitted: () => void
}) {
  const [update, { isLoading }] = useUpdateTaskMutation()
  const submission = getSubmission(task)

  const [form, setForm] = useState({
    prLink: submission.prLink,
    docLink: submission.docLink,
    summary: submission.summary,
    blockers: submission.blockers,
  })

  const f = (k: string) => (e: ChangeEvent<any>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function submitWork() {
    if (!form.prLink.trim()) {
      toast.error('PR link is required')
      return
    }

    if (!form.summary.trim()) {
      toast.error('Short summary is required')
      return
    }

    const payload: any = {
      status: 'REVIEW',
      proofLink: form.prLink.trim(),
      submissionPrLink: form.prLink.trim(),
      submissionDocLink: form.docLink.trim(),
      submissionSummary: form.summary.trim(),
      submissionBlockers: form.blockers.trim(),
      submittedAt: new Date().toISOString(),
      reviewStatus: 'SUBMITTED_FOR_REVIEW',
    }

    try {
      await update({ id: task.id, data: payload }).unwrap()
      toast.success('Work submitted for review')
      onSubmitted()
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit work')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Submit Work" size="lg">
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <p className="text-sm font-bold text-blue-700">{task.title}</p>
          <p className="text-xs text-blue-600 mt-1">
            Submit your PR link and short work summary. The task will move to Submitted for Review.
          </p>
        </div>

        <div>
          <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
            PR Link *
          </label>
          <input
            className="input"
            value={form.prLink}
            onChange={f('prLink')}
            placeholder="Paste GitHub PR link"
            autoFocus
          />
        </div>

        <div>
          <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Document / Demo Link
          </label>
          <input
            className="input"
            value={form.docLink}
            onChange={f('docLink')}
            placeholder="Optional document, demo, or reference link"
          />
        </div>

        <div>
          <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Short Summary *
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            value={form.summary}
            onChange={f('summary')}
            placeholder="Write 2-3 lines about what you completed"
          />
        </div>

        <div>
          <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Doubts / Blockers
          </label>
          <textarea
            className="input resize-none"
            rows={2}
            value={form.blockers}
            onChange={f('blockers')}
            placeholder="Optional blockers or doubts"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={isLoading} onClick={submitWork}>
            <Send size={14} />
            Submit for Review
          </Button>
        </div>
      </div>
    </Modal>
  )
}
function TaskModal({
  open,
  onClose,
  task,
}: {
  open: boolean
  onClose: () => void
  task?: Task
}) {
  const isEdit = !!task
  const user = useCurrentUser()
  const [create, { isLoading: creating }] = useCreateTaskMutation()
  const [update, { isLoading: updating }] = useUpdateTaskMutation()
  const { data: users = [] } = useGetUsersQuery()
  const { data: allTasks = [], refetch } = useGetTasksQuery()

  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'MEDIUM',
    squad: (task as any)?.squad ?? (user?.role === 'MANAGER' ? user?.squad ?? '' : ''),
    assignedToId: (task as any)?.assignedToId ?? (task as any)?.assignedTo?.id ?? '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
    proofLink: (task as any)?.proofLink ?? '',
    feedback: (task as any)?.feedback ?? '',
  })

  const submission = getSubmission(task)
  const canReview = user?.role === ROLES.MANAGER || user?.role === ROLES.SUPER_ADMIN
  const isAssignedIntern = user?.role === ROLES.INTERN && user?.id === getTaskAssigneeId(task as Task)
  const canSubmitWork = isEdit && isAssignedIntern && task?.status !== 'DONE'

  const f = (k: string) => (e: ChangeEvent<any>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const selectedSquadKey = getSquadKey(form.squad)

  const internUsers = useMemo(() => {
    return users
      .filter((u: any) => isInternUser(u))
      .filter((u: any) => getUserId(u))
  }, [users])

  const exactSquadUsers = useMemo(() => {
    return internUsers.filter((u: any) => userMatchesSquad(u, form.squad))
  }, [internUsers, form.squad])

  const assignableUsers = useMemo(() => {
    if (!form.squad) return internUsers

    if (exactSquadUsers.length > 0) return exactSquadUsers

    return []
  }, [form.squad, internUsers, exactSquadUsers])

  const selectedUser = users.find(u => u.id === form.assignedToId)
  const selectedUserActiveTasks = selectedUser
    ? getActiveTaskCount(allTasks, selectedUser.id)
    : 0
  const selectedWorkload = getWorkloadMeta(selectedUserActiveTasks)

  const followUpMessage = selectedUser
    ? `Hi ${selectedUser.name}, you have been assigned the task "${form.title || 'your task'}" under ${form.squad || 'your'} squad. Please complete it before the due date${form.dueDate ? ` (${new Date(form.dueDate).toLocaleString()})` : ''}. Let me know if you are blocked or need any clarification.`
    : ''

  async function copyFollowUpMessage() {
    if (!followUpMessage) {
      toast.error('Select an intern first')
      return
    }

    await copyText(followUpMessage, 'Follow-up message copied')
  }

  async function submit() {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!form.squad) {
      toast.error('Please select a squad')
      return
    }

    if (!form.assignedToId) {
      toast.error('Please assign this task to someone')
      return
    }

    if (!form.dueDate) {
      toast.error('Please select a due date')
      return
    }

    const selectedUser = users.find(u => u.id === form.assignedToId)

    if (!selectedUser) {
      toast.error('Selected intern not found')
      return
    }

    if (selectedUser.role !== ROLES.INTERN) {
      toast.error('Task can be assigned only to interns')
      return
    }

    if (selectedUser.squad !== form.squad) {
      toast.error('Selected intern does not belong to this squad')
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || '',
      priority: form.priority,
      squad: form.squad,
      assignedToId: form.assignedToId,
      dueDate: form.dueDate,
      proofLink: form.proofLink || '',
      feedback: form.feedback || '',
    }

    try {
      if (isEdit) {
        await update({
          id: task!.id,
          data: payload,
        }).unwrap()

        toast.success('Task updated successfully')
      } else {
        await create({
          ...payload,
          status: 'TODO',
          assignedById: user?.id,
        }).unwrap()

        toast.success(`Task assigned to ${selectedUser.name}`)
      }

      onClose()
    } catch {
      toast.error('Failed to save task')
    }
  }

  async function markCompleted() {
    if (!task) return

    const payload: any = {
      status: 'DONE',
      reviewStatus: 'APPROVED',
      feedback: form.feedback || submission.feedback || '',
      reviewFeedback: form.feedback || submission.feedback || '',
      reviewedAt: new Date().toISOString(),
    }

    try {
      await update({ id: task.id, data: payload }).unwrap()
      toast.success('Task marked as completed')
      refetch()
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to complete task')
    }
  }

  async function askChanges() {
    if (!task) return

    const comment = form.feedback || prompt('Enter changes required for the intern:', submission.feedback || '')

    if (comment === null) return

    const payload: any = {
      status: 'IN_PROGRESS',
      reviewStatus: 'CHANGES_REQUESTED',
      feedback: comment || '',
      reviewFeedback: comment || '',
      reviewedAt: new Date().toISOString(),
    }

    try {
      await update({ id: task.id, data: payload }).unwrap()
      toast.success('Changes requested')
      refetch()
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to request changes')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Task Details' : 'New Task'} size="lg">
      <div className="space-y-4">
        <div>
          <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Title *
          </label>
          <input
            className="input"
            value={form.title}
            onChange={f('title')}
            placeholder="What needs to be done?"
            autoFocus
            disabled={user?.role === ROLES.INTERN}
          />
        </div>

        <div>
          <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Description
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            value={form.description}
            onChange={f('description')}
            placeholder="Optional details or context"
            disabled={user?.role === ROLES.INTERN}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Squad
            </label>
            <select
              className="input"
              value={form.squad}
              disabled={user?.role === ROLES.INTERN}
              onChange={(e) => {
                const selectedSquad = e.target.value
                setForm(p => ({
                  ...p,
                  squad: selectedSquad,
                  assignedToId: '',
                }))
              }}
            >
              <option value="">Select squad</option>
              {Object.entries(SQUADS).map(([k, v]) => (
                <option key={k} value={v}>
                  {k.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Priority
            </label>
            <select
              className="input"
              value={form.priority}
              onChange={f('priority')}
              disabled={user?.role === ROLES.INTERN}
            >
              {TASK_PRIORITIES.map(p => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Assign to
            </label>
            <select
              className="input"
              value={form.assignedToId}
              onChange={f('assignedToId')}
              disabled={user?.role === ROLES.INTERN || !form.squad || assignableUsers.length === 0}
            >
              <option value="">
                {!form.squad
                  ? 'Select squad first'
                  : assignableUsers.length === 0
                    ? 'No interns in this squad'
                    : 'Select intern'}
              </option>

              {assignableUsers.map((u: any) => {
                const userId = getUserId(u)
                const userName = getUserName(u)
                const userSquad = getUserSquad(u)
                const activeCount = getActiveTaskCount(allTasks, userId)
                const workload = getWorkloadMeta(activeCount)

                return (
                  <option key={userId} value={userId}>
                    {workload.emoji} {userName} {userSquad ? `— ${userSquad}` : ''} — {activeCount === 0 ? 'Available' : `${activeCount} active task${activeCount > 1 ? 's' : ''}`}
                  </option>
                )
              })}
            </select>

            {form.squad && assignableUsers.length === 0 && user?.role !== ROLES.INTERN && (
              <p className="mt-1 text-[11px] text-red-500">
                No intern users found for {selectedSquadKey || form.squad}. Please check if those interns are added with correct squad details.
              </p>
            )}

            {assignableUsers.length > 0 && user?.role !== ROLES.INTERN && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  🟢 Available
                </span>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  🟡 Has active task
                </span>
                <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  🔴 Busy
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Due date
            </label>
            <input
              className="input"
              type="datetime-local"
              value={form.dueDate}
              onChange={f('dueDate')}
              disabled={user?.role === ROLES.INTERN}
            />
          </div>
        </div>

        {!isEdit && form.assignedToId && selectedUser && (
          <div className={cn('rounded-xl border px-4 py-3 text-xs space-y-3', selectedWorkload.bg, selectedWorkload.border)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={cn('font-bold flex items-center gap-2', selectedWorkload.text)}>
                  <span className={cn('w-2 h-2 rounded-full', selectedWorkload.dot)} />
                  Assignment record preview
                </p>

                <p className="mt-1 text-gray-700">
                  This task will be assigned to{' '}
                  <span className="font-bold">{selectedUser.name}</span>{' '}
                  under <span className="font-bold">{form.squad}</span> squad.
                </p>

                <p className="mt-1 text-gray-600">
                  Current workload:{' '}
                  <span className={cn('font-bold', selectedWorkload.text)}>
                    {selectedUserActiveTasks === 0
                      ? 'Available'
                      : `${selectedUserActiveTasks} active task${selectedUserActiveTasks > 1 ? 's' : ''} · ${selectedWorkload.label}`}
                  </span>
                </p>
              </div>

              <Button
                variant="secondary"
                size="xs"
                onClick={copyFollowUpMessage}
                className="flex-shrink-0"
              >
                <Copy size={12} />
                Copy message
              </Button>
            </div>

            {selectedUserActiveTasks > 0 && (
              <div className="rounded-lg bg-white/70 border border-white px-3 py-2 flex items-start gap-2">
                <AlertTriangle size={14} className={selectedWorkload.text} />
                <p className="text-gray-700">
                  This intern already has active work. Please assign only if the task is urgent or manageable.
                </p>
              </div>
            )}

            <div className="rounded-lg bg-white/70 border border-white px-3 py-2">
              <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                <MessageSquareText size={13} />
                Follow-up message
              </p>
              <p className="mt-1 text-gray-500 leading-relaxed">{followUpMessage}</p>
            </div>
          </div>
        )}

        {isEdit && hasSubmission(task) && (
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardCheck size={14} />
                    Submitted for Review
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {submission.submittedAt
                      ? `Submitted on ${new Date(submission.submittedAt).toLocaleString()}`
                      : 'Intern has submitted work for this task'}
                  </p>
                </div>

                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600 text-white">
                  REVIEW
                </span>
              </div>

              {submission.prLink && (
                <div className="rounded-lg bg-white border border-purple-100 p-3 mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">PR Link</p>
                  <p className="text-xs text-gray-700 break-all">{submission.prLink}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => copyText(submission.prLink, 'PR link copied')}
                    >
                      <Copy size={12} />
                      Copy PR
                    </Button>

                    <a href={submission.prLink} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="xs">
                        <ExternalLink size={12} />
                        Open PR
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {submission.docLink && (
                <div className="rounded-lg bg-white border border-purple-100 p-3 mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Document / Demo Link</p>
                  <p className="text-xs text-gray-700 break-all">{submission.docLink}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => copyText(submission.docLink, 'Document link copied')}
                    >
                      <Copy size={12} />
                      Copy Link
                    </Button>

                    <a href={submission.docLink} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="xs">
                        <ExternalLink size={12} />
                        Open Link
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {submission.summary && (
                <div className="rounded-lg bg-white border border-purple-100 p-3 mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Work Summary</p>
                  <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                    {submission.summary}
                  </p>
                </div>
              )}

              {submission.blockers && (
                <div className="rounded-lg bg-white border border-amber-100 p-3">
                  <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Doubts / Blockers</p>
                  <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                    {submission.blockers}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {isEdit && canReview && hasSubmission(task) && (
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div>
              <label className="label block mb-1.5 text-xs font-bold text-blue-600 uppercase">
                Review Feedback
              </label>
              <textarea
                className="input border-blue-100 focus:border-blue-300 resize-none"
                rows={2}
                value={form.feedback || submission.feedback}
                onChange={f('feedback')}
                placeholder="Add review comment before approving or asking changes"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="primary" onClick={markCompleted} loading={updating}>
                <CheckCircle2 size={14} />
                Mark Completed
              </Button>

              <Button variant="secondary" onClick={askChanges} loading={updating}>
                <AlertTriangle size={14} />
                Ask for Changes
              </Button>
            </div>
          </div>
        )}

        {isEdit && canSubmitWork && (
          <div className="pt-4 border-t border-gray-100">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-blue-700">Ready to submit?</p>
                <p className="text-xs text-blue-600 mt-1">
                  Add your PR link and short summary to send this task for review.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  onClose()
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('open-submit-work', { detail: task }))
                  }, 0)
                }}
              >
                <Send size={14} />
                Submit Work
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          {user?.role !== ROLES.INTERN && (
            <Button variant="primary" loading={creating || updating} onClick={submit}>
              {isEdit ? 'Save Changes' : 'Assign Task'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function TaskCard({
  task,
  onEdit,
  onMove,
  onDelete,
  onFollowUp,
  onSubmitWork,
}: {
  task: Task
  onEdit: () => void
  onMove: (status: TaskStatus) => void
  onDelete: () => void
  onFollowUp: () => void
  onSubmitWork: () => void
}) {
  const user = useCurrentUser()
  const priority = PRIORITY_MAP[task.priority]
  const [menuOpen, setMenuOpen] = useState(false)
  const due = getDueBadge(task)
  const newTask = isNewTask(task)
  const borderClass = PRIORITY_BORDER[task.priority] ?? 'border-l-gray-300'
  const submitted = hasSubmission(task) || task.status === 'REVIEW'
  const isAssignedIntern = user?.role === ROLES.INTERN && user?.id === getTaskAssigneeId(task)
  const canSubmitWork = isAssignedIntern && task.status !== 'DONE'

  function stopCardClick(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      className={cn(
        'relative bg-white border border-l-4 border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300 transition-all cursor-pointer group',
        borderClass,
        newTask && 'ring-2 ring-blue-100',
        submitted && 'ring-2 ring-purple-100',
        menuOpen && 'z-50'
      )}
      onClick={onEdit}
    >
      {newTask && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
          <Sparkles size={10} />
          New
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {priority && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ background: priority.bgColor, color: priority.color }}
            >
              {priority.label}
            </span>
          )}

          {due && (
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1',
                due.isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
              )}
            >
              {due.isOverdue ? <AlertTriangle size={10} /> : <Clock size={10} />}
              {due.label}
            </span>
          )}

          {submitted && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 flex items-center gap-1">
              <ClipboardCheck size={10} />
              Submitted
            </span>
          )}
        </div>

        <div
          className="relative ml-auto z-50"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            type="button"
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all opacity-100"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMenuOpen(v => !v)
            }}
          >
            <MoreHorizontal size={15} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-7 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[9999] min-w-[185px]"
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            >
              {canSubmitWork && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-purple-600 hover:bg-purple-50 font-semibold"
                  onClick={(e) => {
                    stopCardClick(e)
                    onSubmitWork()
                    setMenuOpen(false)
                  }}
                >
                  Submit Work
                </button>
              )}

              {TASK_STATUSES.filter(s => s.key !== task.status).map(s => (
                <button
                  key={s.key}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  onClick={(e) => {
                    stopCardClick(e)
                    onMove(s.key as TaskStatus)
                    setMenuOpen(false)
                  }}
                >
                  Move to {s.label}
                </button>
              ))}

              <div className="border-t border-gray-100 my-1" />

              {task.status !== 'DONE' && user?.role !== ROLES.INTERN && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    stopCardClick(e)
                    onFollowUp()
                    setMenuOpen(false)
                  }}
                >
                  Send follow-up
                </button>
              )}
              {user?.role !== ROLES.INTERN && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    stopCardClick(e)
                    onDelete()
                    setMenuOpen(false)
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <p className={cn('text-sm font-semibold leading-snug mb-2 text-gray-900', task.status === 'DONE' && 'line-through text-gray-400')}>
        {task.title}
      </p>

      {(task as any)?.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {(task as any).description}
        </p>
      )}

      {submitted && (
        <div className="rounded-lg bg-purple-50 border border-purple-100 px-2 py-1.5 mb-3">
          <p className="text-[10px] font-bold text-purple-600 uppercase">
            Submitted for Review
          </p>
          <p className="text-[10px] text-purple-500 mt-0.5">
            Review PR link inside task details
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-1 gap-2">
        <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase font-bold tracking-tighter">
          {task.squad}
        </span>

        {task.assignedTo && (
          <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
            <User size={10} />
            {task.assignedTo.name?.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  )
}

type ViewMode = 'board' | 'list' | 'mine'

export default function TasksPage() {
  const user = useCurrentUser()
  const [view, setView] = useState<ViewMode>('board')
  const [addOpen, setAddOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>()
  const [submitTask, setSubmitTask] = useState<Task | undefined>()
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [squadFilter, setSquadFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data: allTasks = [], isLoading, refetch } = useGetTasksQuery()
  const { data: myTasks = [] } = useGetMyTasksQuery()
  const [updateTask] = useUpdateTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()
  const [sendTaskFollowUp] = useSendTaskFollowUpMutation()

  if (typeof window !== 'undefined') {
    window.onopenSubmitWork = undefined as any
  }

  const tasks = (() => {
    if (view === 'mine' || user?.role === ROLES.INTERN) {
      return myTasks
    }

    if (user?.role === ROLES.MANAGER) {
      return allTasks.filter(t => getSquadKey(t.squad) === getSquadKey(user.squad))
    }

    return allTasks
  })()

  const filterOptions = useMemo(() => {
    const squads = Array.from(new Set(tasks.map(t => (t as any)?.squad).filter(Boolean)))
    return { squads }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase()

    return tasks.filter(task => {
      const assignedName = task.assignedTo?.name?.toLowerCase() ?? ''
      const title = task.title?.toLowerCase() ?? ''
      const description = (task as any)?.description?.toLowerCase() ?? ''
      const squad = (task as any)?.squad ?? ''
      const submission = getSubmission(task)

      const matchesSearch =
        !q ||
        title.includes(q) ||
        description.includes(q) ||
        assignedName.includes(q) ||
        squad.toLowerCase().includes(q) ||
        submission.prLink.toLowerCase().includes(q) ||
        submission.summary.toLowerCase().includes(q)

      const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter
      const matchesSquad = squadFilter === 'ALL' || squad === squadFilter
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter

      return matchesSearch && matchesPriority && matchesSquad && matchesStatus
    })
  }, [tasks, search, priorityFilter, squadFilter, statusFilter])

  async function moveTask(id: string, status: TaskStatus) {
    try {
      await updateTask({ id, data: { status } }).unwrap()
      toast.success(`Task moved to ${TASK_STATUSES.find(s => s.key === status)?.label ?? status}`)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to move task')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await deleteTask(id).unwrap()
      toast.success('Task deleted successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete task')
    }
  }

  async function handleFollowUp(task: Task) {
    const defaultMessage = `Reminder: Please complete the task "${task.title}" as soon as possible.`
    const message = prompt('Enter follow-up message for the intern:', defaultMessage)

    if (message === null) return

    try {
      await sendTaskFollowUp({
        id: task.id,
        message: message.trim() || defaultMessage,
      }).unwrap()

      toast.success('Follow-up message sent')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send follow-up')
    }
  }

  function clearFilters() {
    setSearch('')
    setPriorityFilter('ALL')
    setSquadFilter('ALL')
    setStatusFilter('ALL')
  }

  const openCount = tasks.filter(t => t.status !== 'DONE').length
  const doneCount = tasks.filter(t => t.status === 'DONE').length
  const urgentCount = tasks.filter(t => t.priority === 'URGENT' && t.status !== 'DONE').length
  const reviewCount = tasks.filter(t => t.status === 'REVIEW').length
  const newCount = tasks.filter(t => isNewTask(t)).length
  const hasFilters = search || priorityFilter !== 'ALL' || squadFilter !== 'ALL' || statusFilter !== 'ALL'
  const canCreateTask = user?.role === ROLES.MANAGER || user?.role === ROLES.SUPER_ADMIN

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            {openCount} active tasks — {doneCount} completed
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
          </Button>
          {canCreateTask && (
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> New Task
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{openCount}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Urgent</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{urgentCount}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review</p>
          <p className="text-2xl font-bold text-purple-500 mt-1">{reviewCount}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{newCount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1 w-fit">
            {([
              ['board', 'Board'],
              ['list', 'List'],
              ['mine', 'My Tasks'],
            ] as [ViewMode, string][]).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200',
                  view === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 h-10 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search task, assignee, squad, PR..."
            />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <SlidersHorizontal size={15} />
              Filters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <select
                className="input h-10 text-xs"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">All priorities</option>
                {TASK_PRIORITIES.map(p => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>

              <select
                className="input h-10 text-xs"
                value={squadFilter}
                onChange={e => setSquadFilter(e.target.value)}
              >
                <option value="ALL">All squads</option>
                {filterOptions.squads.map(squad => (
                  <option key={squad} value={squad}>
                    {squad}
                  </option>
                ))}
              </select>

              <select
                className="input h-10 text-xs"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All statuses</option>
                {TASK_STATUSES.map(s => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Empty
          title="No matching tasks"
          description={hasFilters ? 'Try changing search or filters' : 'Create a task to get started'}
        />
      ) : view === 'board' || view === 'mine' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key)

            return (
              <div key={col.key} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {col.label}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-100 rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        No tasks here
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Great, this column is clear
                      </p>
                    </div>
                  )}

                  {colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => setEditTask(task)}
                      onMove={(status) => moveTask(task.id, status)}
                      onDelete={() => handleDelete(task.id)}
                      onFollowUp={() => handleFollowUp(task)}
                      onSubmitWork={() => setSubmitTask(task)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto whitespace-nowrap shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Task', 'Priority', 'Assigned', 'Due', 'Status', 'Submission', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredTasks.map((task) => {
                const priority = PRIORITY_MAP[task.priority]
                const due = getDueBadge(task)
                const submitted = hasSubmission(task) || task.status === 'REVIEW'
                const submission = getSubmission(task)
                const isAssignedIntern = user?.role === ROLES.INTERN && user?.id === getTaskAssigneeId(task)
                const canSubmitWork = isAssignedIntern && task.status !== 'DONE'

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    onClick={() => setEditTask(task)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {task.status === 'DONE'
                          ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                          : <Circle size={16} className="text-gray-300 flex-shrink-0" />
                        }
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm font-medium text-gray-700', task.status === 'DONE' && 'line-through text-gray-400')}>
                              {task.title}
                            </p>
                            {isNewTask(task) && (
                              <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                            {task.squad}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {priority && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                          style={{ background: `${priority.color}15`, color: priority.color }}
                        >
                          {priority.label}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                      {task.assignedTo?.name ?? '—'}
                    </td>

                    <td className="px-6 py-4">
                      {due ? (
                        <span className={cn('text-xs font-medium', due.isOverdue ? 'text-red-500' : 'text-gray-500')}>
                          {due.label}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={task.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => moveTask(task.id, e.target.value as TaskStatus)}
                        className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      >
                        {TASK_STATUSES.map(s => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      {submitted ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-1 rounded-full w-fit">
                            Submitted
                          </span>
                          {submission.prLink && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                copyText(submission.prLink, 'PR link copied')
                              }}
                              className="text-[10px] text-blue-600 hover:underline text-left"
                            >
                              Copy PR
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {canSubmitWork && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={e => {
                              e.stopPropagation()
                              setSubmitTask(task)
                            }}
                            className="text-purple-600 hover:bg-purple-50"
                          >
                            Submit
                          </Button>
                        )}

                        {task.status !== 'DONE' && user?.role !== ROLES.INTERN && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={e => {
                              e.stopPropagation()
                              handleFollowUp(task)
                            }}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            Follow-up
                          </Button>
                        )}

                        {user?.role !== ROLES.INTERN && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={e => {
                              e.stopPropagation()
                              handleDelete(task.id)
                            }}
                            className="text-red-500 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && <TaskModal open onClose={() => setAddOpen(false)} />}
      {editTask && <TaskModal open onClose={() => setEditTask(undefined)} task={editTask} />}
      {submitTask && (
        <SubmissionModal
          open
          task={submitTask}
          onClose={() => setSubmitTask(undefined)}
          onSubmitted={() => {
            refetch()
            setSubmitTask(undefined)
          }}
        />
      )}
    </div>
  )
}