'use client'
import { useState } from 'react'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { useGetStudentsQuery, useCreateStudentMutation } from '@/store/api/studentsApi'
import { Button, Badge, Avatar, Modal, Spinner, Empty } from '@/components/ui'
import { STUDENT_STAGES } from '@/lib/constants'
import { formatRelative, cn } from '@/lib/utils'
import type { StudentStage } from '@/types'

const STAGE_MAP = Object.fromEntries(STUDENT_STAGES.map(s => [s.key, s]))

function AddStudentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [create, { isLoading }] = useCreateStudentMutation()
  const [form, setForm] = useState({ name: '', email: '', parentName: '', phone: '', grade: '', source: '' })
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function submit() {
    if (!form.name || !form.email) return
    await create(form).unwrap()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Student" size="md">
      <div className="space-y-3">
        {[['name','Student Name *'],['email','Email *'],['parentName','Parent Name'],['phone','Phone'],['grade','Grade / Class']].map(([k,l]) => (
          <div key={k}>
            <label className="label block mb-1">{l}</label>
            <input className="input" value={(form as any)[k]} onChange={f(k)} placeholder={l} />
          </div>
        ))}
        <div>
          <label className="label block mb-1">Source</label>
          <select className="input" value={form.source} onChange={f('source')}>
            <option value="">Select source</option>
            {['Referral','LinkedIn','School','WhatsApp','Website','Other'].map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={submit}>Add Student</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function StudentsPage() {
  const [search, setSearch]       = useState('')
  const [stageFilter, setStage]   = useState<StudentStage | 'all'>('all')
  const [addOpen, setAddOpen]     = useState(false)
  const { data: students = [], isLoading, refetch } = useGetStudentsQuery()

  const filtered = students.filter(s => {
    if (stageFilter !== 'all' && s.stage !== stageFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.parentName ?? '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} total · {students.filter(s => s.stage === 'active').length} active</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw size={13} /></Button>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}><Plus size={13} /> Add Student</Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 w-56 text-xs" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setStage('all')} className={cn('px-3 py-1.5 text-xs rounded-md font-medium transition-all', stageFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600')}>All</button>
          {STUDENT_STAGES.map(s => (
            <button key={s.key} onClick={() => setStage(s.key as StudentStage)}
              className={cn('px-3 py-1.5 text-xs rounded-md font-medium transition-all', stageFilter === s.key ? 'text-white' : 'bg-white border border-gray-200 text-gray-600')}
              style={stageFilter === s.key ? { background: s.color } : {}}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner /></div> :
       filtered.length === 0 ? <Empty title="No students found" description="Add a student to get started" /> : (
        <div className="card overflow-x-auto whitespace-nowrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Student', 'Parent', 'Contact', 'Grade', 'Stage', 'Added'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const stage = STAGE_MAP[s.stage]
                return (
                  <tr key={s.id} className={cn('border-b border-gray-50 hover:bg-gray-50 transition-colors', i === filtered.length - 1 && 'border-0')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.name} size={28} bg="#7C3AED" />
                        <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.parentName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600">{s.email}</p>
                      {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.grade ?? '—'}</td>
                    <td className="px-4 py-3">{stage && <Badge bgColor={stage.bgColor} textColor={stage.textColor} color={stage.color}>{stage.label}</Badge>}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatRelative(s.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
