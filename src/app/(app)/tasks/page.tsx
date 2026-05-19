'use client'
import { useState } from 'react'
import { Plus, RefreshCw, User, CheckCircle2, Circle, MoreHorizontal } from 'lucide-react'
import { useGetTasksQuery, useGetMyTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '@/store/api/tasksApi'
import { useGetUsersQuery } from '@/store/api/usersApi'
import { useCurrentUser } from '@/store/hooks'
import { Button, Modal, Spinner, Empty } from '@/components/ui'
import { formatDue, cn } from '@/lib/utils'
import type { TaskStatus, Task } from '@/types'
import toast from 'react-hot-toast'

import { TASK_PRIORITIES, TASK_STATUSES, ROLES, SQUADS } from '@/lib/constants'

const PRIORITY_MAP = Object.fromEntries(TASK_PRIORITIES.map(p => [p.key, p]))

const COLUMNS = TASK_STATUSES.map(s => ({
  ...s,
  bgColor: s.color === '#6B7280' ? '#F3F4F6' : `${s.color}10`
}))

function TaskModal({
  open, onClose, task,
}: { open: boolean; onClose: () => void; task?: Task }) {
  const isEdit = !!task
  const user = useCurrentUser()
  const [create, { isLoading: creating }] = useCreateTaskMutation()
  const [update, { isLoading: updating }] = useUpdateTaskMutation()
  const { data: users = [] } = useGetUsersQuery()

  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'MEDIUM',
    squad: (task as any)?.squad ?? '',
    assignedToId: (task as any)?.assignedToId ?? (task as any)?.assignedTo?.id ?? '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
    proofLink: (task as any)?.proofLink ?? '',
    feedback: (task as any)?.feedback ?? '',
  })

  const f = (k: string) => (e: React.ChangeEvent<any>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const assignableUsers = users.filter(u => {
    if (!form.squad) return false
    return u.role === ROLES.INTERN && u.squad === form.squad
  })

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

    try {
      if (isEdit) {
        await update({ id: task!.id, data: form }).unwrap()
        toast.success('Task updated')
      } else {
        await create({
          ...form,
          status: 'TODO',
          assignedById: user?.id
        }).unwrap()
        toast.success('Task created')
      }
      onClose()
    } catch {
      toast.error('Failed to save task')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Task' : 'New Task'} size="lg">
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
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Squad
            </label>
            <select
              className="input"
              value={form.squad}
              onChange={(e) =>
                setForm(p => ({
                  ...p,
                  squad: e.target.value,
                  assignedToId: ''
                }))
              }
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
            <select className="input" value={form.priority} onChange={f('priority')}>
              {TASK_PRIORITIES.map(p => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Assign to
            </label>
            <select className="input" value={form.assignedToId} onChange={f('assignedToId')}>
              <option value="">Unassigned</option>
              {assignableUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
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
            />
          </div>
        </div>

        {isEdit && (
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div>
              <label className="label block mb-1.5 text-xs font-bold text-purple-600 uppercase">
                Proof Link (Intern)
              </label>
              <input
                className="input border-purple-100 focus:border-purple-300"
                value={form.proofLink}
                onChange={f('proofLink')}
                placeholder="https://..."
                disabled={user?.role === ROLES.MANAGER}
              />
            </div>

            {(user?.role === ROLES.MANAGER || user?.role === ROLES.SUPER_ADMIN || form.feedback) && (
              <div>
                <label className="label block mb-1.5 text-xs font-bold text-blue-600 uppercase">
                  Manager Feedback
                </label>
                <textarea
                  className="input border-blue-100 focus:border-blue-300 resize-none"
                  rows={2}
                  value={form.feedback}
                  onChange={f('feedback')}
                  placeholder="Approve/Reject reason..."
                  disabled={user?.role === ROLES.INTERN}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={creating || updating} onClick={submit}>
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function TaskCard({ task, onEdit, onMove, onDelete }: {
  task: Task
  onEdit: () => void
  onMove: (status: TaskStatus) => void
  onDelete: () => void
}) {
  const priority = PRIORITY_MAP[task.priority]
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        {priority && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: priority.bgColor, color: priority.color }}
          >
            {priority.label}
          </span>
        )}

        <div className="relative ml-auto" onClick={e => e.stopPropagation()}>
          <button
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-700 rounded transition-all"
            onClick={() => setMenuOpen(v => !v)}
          >
            <MoreHorizontal size={14} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-5 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
              onClick={e => e.stopPropagation()}
            >
              {TASK_STATUSES.filter(s => s.key !== task.status).map(s => (
                <button
                  key={s.key}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    onMove(s.key as TaskStatus)
                    setMenuOpen(false)
                  }}
                >
                  Move to {s.label}
                </button>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                onClick={() => {
                  onDelete()
                  setMenuOpen(false)
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className={cn('text-sm font-medium leading-snug mb-2', task.status === 'DONE' && 'line-through text-gray-400')}>
        {task.title}
      </p>

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

  const { data: allTasks = [], isLoading, refetch } = useGetTasksQuery()
  const { data: myTasks = [] } = useGetMyTasksQuery()
  const [updateTask] = useUpdateTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()

  const tasks = (() => {
    if (view === 'mine' || user?.role === ROLES.INTERN) {
      return myTasks
    }

    if (user?.role === ROLES.MANAGER) {
      return allTasks.filter(t => t.squad === user.squad)
    }

    return allTasks
  })()

  async function moveTask(id: string, status: TaskStatus) {
    try {
      await updateTask({ id, data: { status } }).unwrap()
    } catch {
      toast.error('Failed to move task')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return

    try {
      await deleteTask(id).unwrap()
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const openCount = tasks.filter(t => t.status !== 'DONE').length
  const doneCount = tasks.filter(t => t.status === 'DONE').length

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
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
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> New Task
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1">
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
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : view === 'board' || view === 'mine' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key)

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
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No tasks</p>
                    </div>
                  )}

                  {colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => setEditTask(task)}
                      onMove={(status) => moveTask(task.id, status)}
                      onDelete={() => handleDelete(task.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : tasks.length === 0 ? (
        <Empty title="No tasks yet" description="Create a task to get started" />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto whitespace-nowrap shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Task', 'Priority', 'Assigned', 'Due', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {tasks.map((task) => {
                const priority = PRIORITY_MAP[task.priority]
                const due = (task as any).dueDate ? formatDue((task as any).dueDate) : null

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
                        <p className={cn('text-sm font-medium text-gray-700', task.status === 'DONE' && 'line-through text-gray-400')}>
                          {task.title}
                        </p>
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

                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={e => {
                          e.stopPropagation()
                          handleDelete(task.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 transition-all"
                      >
                        Delete
                      </Button>
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
    </div>
  )
}
