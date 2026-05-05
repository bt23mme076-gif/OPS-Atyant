'use client'
import { useState } from 'react'
import { Plus, RefreshCw, Calendar, User, Flag, CheckCircle2, Circle, Clock, MoreHorizontal } from 'lucide-react'
import { useGetTasksQuery, useGetMyTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '@/store/api/tasksApi'
import { useGetUsersQuery } from '@/store/api/usersApi'
import { useCurrentUser } from '@/store/hooks'
import { Button, Modal, Spinner, Empty } from '@/components/ui'
import { TASK_PRIORITIES } from '@/lib/constants'
import { formatDue, formatDate, cn } from '@/lib/utils'
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
    title:        task?.title        ?? '',
    description:  task?.description  ?? '',
    priority:     task?.priority     ?? 'MEDIUM',
    squad:        (task as any)?.squad ?? user?.squad ?? 'TECH',
    assignedToId: (task as any)?.assignedToId ?? '',
    dueDate:      task?.dueDate ? new Date(task.dueDate).toISOString().slice(0,16) : '',
    proofLink:    (task as any)?.proofLink ?? '',
    feedback:     (task as any)?.feedback  ?? '',
  })
  const f = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }))

  // Filter users to only show interns in the same squad if manager
  const assignableUsers = users.filter(u => {
    if (user?.role === ROLES.MANAGER) {
      return u.role === ROLES.INTERN && u.squad === user.squad
    }
    return true
  })

  async function submit() {
    if (!form.title.trim()) return
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
    } catch { toast.error('Failed to save task') }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Task' : 'New Task'} size="lg">
      <div className="space-y-4">
        <div>
          <label className="label block mb-1.5">Title *</label>
          <input className="input" value={form.title} onChange={f('title')}
            placeholder="What needs to be done?" autoFocus />
        </div>
        <div>
          <label className="label block mb-1.5">Description</label>
          <textarea className="input resize-none" rows={3} value={form.description}
            onChange={f('description')} placeholder="Optional details or context" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label block mb-1.5">Squad</label>
            <select className="input" value={form.squad} onChange={f('squad')}>
              {Object.entries(SQUADS).map(([k, v]) => (
                <option key={k} value={v}>{k.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label block mb-1.5">Priority</label>
            <select className="input" value={form.priority} onChange={f('priority')}>
              {TASK_PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label block mb-1.5">Assign to</label>
            <select className="input" value={form.assignedToId} onChange={f('assignedToId')}>
              <option value="">Unassigned</option>
              {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label block mb-1.5">Due date</label>
            <input className="input" type="datetime-local" value={form.dueDate} onChange={f('dueDate')} />
          </div>
        </div>

        {isEdit && (
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div>
              <label className="label block mb-1.5 text-purple-600 font-bold">Proof Link (Intern)</label>
              <input className="input border-purple-100 focus:border-purple-300" value={form.proofLink} onChange={f('proofLink')}
                placeholder="https://..." disabled={user?.role === ROLES.MANAGER} />
            </div>
            {(user?.role === ROLES.MANAGER || user?.role === ROLES.SUPER_ADMIN || form.feedback) && (
              <div>
                <label className="label block mb-1.5 text-blue-600 font-bold">Manager Feedback</label>
                <textarea className="input border-blue-100 focus:border-blue-300 resize-none" rows={2} 
                  value={form.feedback} onChange={f('feedback')}
                  placeholder="Approve/Reject reason..." disabled={user?.role === ROLES.INTERN} />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
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
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
      onClick={onEdit}>
      {/* Priority + menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {priority && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: priority.bgColor, color: priority.color }}>
            {priority.label}
          </span>
        )}
        <div className="relative ml-auto" onClick={e => e.stopPropagation()}>
          <button className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-700 rounded transition-all"
            onClick={() => setMenuOpen(v => !v)}>
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-5 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
              onClick={e => e.stopPropagation()}>
              {TASK_STATUSES.filter(s => s.key !== task.status).map(s => (
                <button key={s.key} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" 
                  onClick={() => { onMove(s.key as TaskStatus); setMenuOpen(false) }}>
                  Move to {s.label}
                </button>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <button className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50" onClick={() => { onDelete(); setMenuOpen(false) }}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p className={cn('text-sm font-medium leading-snug mb-2', task.status === 'DONE' && 'line-through text-gray-400')}>
        {task.title}
      </p>

      {/* Footer */}
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
  const [view, setView]       = useState<ViewMode>('board')
  const [addOpen, setAddOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>()

  const { data: allTasks = [], isLoading, refetch } = useGetTasksQuery()
  const { data: myTasks = [] }                       = useGetMyTasksQuery()
  const [updateTask] = useUpdateTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()

  // RBAC Filtering Logic
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
    try { await updateTask({ id, data: { status } }).unwrap() }
    catch { toast.error('Failed to move task') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    try { await deleteTask(id).unwrap(); toast.success('Task deleted') }
    catch { toast.error('Failed to delete') }
  }

  const openCount = tasks.filter(t => t.status !== 'DONE').length
  const doneCount = tasks.filter(t => t.status === 'DONE').length


  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {openCount} open · {doneCount} done
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw size={13} /></Button>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}><Plus size={13} /> New Task</Button>
        </div>
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {([
            ['board', 'Board'],
            ['list',  'List'],
            ['mine',  'My Tasks'],
          ] as [ViewMode, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                view === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner /></div> : (

        /* Board view */
        view === 'board' || view === 'mine' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.key)
              return (
                <div key={col.key} className="bg-gray-50 rounded-xl p-3">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5 font-medium">
                        {colTasks.length}
                      </span>
                      <button onClick={() => setAddOpen(true)}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 hover:bg-white rounded">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2 min-h-[100px]">
                    {colTasks.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-6">No tasks</p>
                    )}
                    {colTasks.map(task => (
                      <TaskCard key={task.id} task={task}
                        onEdit={() => setEditTask(task)}
                        onMove={(status) => moveTask(task.id, status)}
                        onDelete={() => handleDelete(task.id)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (

          /* List view */
          tasks.length === 0 ? <Empty title="No tasks yet" description="Create a task to get started" /> : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Task', 'Priority', 'Assigned', 'Due', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => {
                    const priority = PRIORITY_MAP[task.priority]
                    const due = task.dueAt ? formatDue(task.dueAt) : null
                    return (
                      <tr key={task.id}
                        className={cn('border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer', i === tasks.length - 1 && 'border-0')}
                        onClick={() => setEditTask(task)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {task.status === 'done'
                              ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                              : <Circle size={14} className="text-gray-300 flex-shrink-0" />
                            }
                            <p className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-gray-400')}>
                              {task.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {priority && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                              style={{ background: priority.bgColor, color: priority.color }}>
                              {priority.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {(task as any).assignedTo?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {due ? (
                            <span className={cn('text-xs', due.isOverdue ? 'text-red-500' : 'text-gray-500')}>
                              {due.label}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={task.status}
                            onClick={e => e.stopPropagation()}
                            onChange={e => moveTask(task.id, e.target.value as TaskStatus)}
                            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-400">
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="xs"
                            onClick={e => { e.stopPropagation(); handleDelete(task.id) }}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )
      )}

      {addOpen   && <TaskModal open onClose={() => setAddOpen(false)} />}
      {editTask  && <TaskModal open onClose={() => setEditTask(undefined)} task={editTask} />}
    </div>
  )
}