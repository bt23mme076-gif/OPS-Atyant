'use client'
import { useState } from 'react'
import { Plus, Search, RefreshCw, LayoutGrid, List, ChevronRight, Linkedin, Building2, MapPin, Phone } from 'lucide-react'
import {
  useGetMentorsQuery, useCreateMentorMutation,
  useUpdateMentorStageMutation, useUpdateMentorMutation,
} from '@/store/api/mentorsApi'
import { Button, Badge, Avatar, Modal, Spinner, Empty } from '@/components/ui'
import { MENTOR_STAGES } from '@/lib/constants'
import { formatRelative, cn } from '@/lib/utils'
import type { MentorStage, Mentor } from '@/types'
import toast from 'react-hot-toast'

const STAGE_MAP = Object.fromEntries(MENTOR_STAGES.map(s => [s.key, s]))

// ── Add/Edit Modal ────────────────────────────────────────────
function MentorModal({ open, onClose, mentor }: { open: boolean; onClose: () => void; mentor?: Mentor }) {
  const isEdit = !!mentor
  const [create, { isLoading: creating }] = useCreateMentorMutation()
  const [update, { isLoading: updating }] = useUpdateMentorMutation()

  const [form, setForm] = useState({
    name:     mentor?.name     ?? '',
    email:    mentor?.email    ?? '',
    phone:    mentor?.phone    ?? '',
    linkedin: mentor?.linkedin ?? '',
    company:  mentor?.company  ?? '',
    domain:   mentor?.domain   ?? '',
    source:   mentor?.source   ?? '',
    notes:    mentor?.notes    ?? '',
  })
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function submit() {
    if (!form.name.trim()) return
    try {
      if (isEdit) {
        await update({ id: mentor!.id, data: form }).unwrap()
        toast.success('Mentor updated')
      } else {
        await create(form).unwrap()
        toast.success(`${form.name} added`)
      }
      onClose()
    } catch { toast.error('Failed to save') }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Mentor' : 'Add Mentor'} size="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          ['name',     'Full Name *', 'text'],
          ['email',    'Email',       'email'],
          ['phone',    'Phone',       'text'],
          ['linkedin', 'LinkedIn URL','text'],
          ['company',  'Company',     'text'],
        ].map(([k, l, t]) => (
          <div key={k}>
            <label className="label block mb-1.5">{l}</label>
            <input className="input" type={t} value={(form as any)[k]} onChange={f(k)} placeholder={l} />
          </div>
        ))}
        <div>
          <label className="label block mb-1.5">Domain</label>
          <select className="input" value={form.domain} onChange={f('domain')}>
            <option value="">Select domain</option>
            {['SWE','Product','Data','Design','Finance','Core Engineering','Marketing','Operations','Other']
              .map(d => <option key={d} value={d.toLowerCase().replace(' ', '_')}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Source</label>
          <select className="input" value={form.source} onChange={f('source')}>
            <option value="">Select source</option>
            {['LinkedIn','Referral','Campus','Cold Outreach','Inbound','College','Organic']
              .map(s => <option key={s} value={s.toLowerCase().replace(' ', '_')}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label block mb-1.5">Notes</label>
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={f('notes')} placeholder="Any notes about this mentor" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 mt-1 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={creating || updating} onClick={submit}>
          {isEdit ? 'Save Changes' : 'Add Mentor'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Mentor Detail Drawer ──────────────────────────────────────
function MentorDrawer({ mentor, onClose, onEdit }: { mentor: Mentor; onClose: () => void; onEdit: () => void }) {
  const [updateStage] = useUpdateMentorStageMutation()
  const stage = STAGE_MAP[mentor.stage]

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={mentor.name} size={44} />
              <div>
                <h2 className="font-bold text-gray-900 text-base">{mentor.name}</h2>
                {mentor.company && <p className="text-sm text-gray-500">{mentor.company}</p>}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-1">✕</button>
          </div>
        </div>

        {/* Stage pipeline */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Pipeline Stage</p>
          <div className="flex flex-wrap gap-1.5">
            {MENTOR_STAGES.map(s => (
              <button key={s.key}
                onClick={() => updateStage({ id: mentor.id, stage: s.key })}
                className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all',
                  mentor.stage === s.key
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                )}
                style={mentor.stage === s.key ? { background: s.color, borderColor: s.color } : {}}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="p-5 flex-1">
          <div className="space-y-3">
            {mentor.email && (
              <a href={`mailto:${mentor.email}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 group">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50">
                  <span className="text-[11px]">@</span>
                </div>
                {mentor.email}
              </a>
            )}
            {mentor.phone && (
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Phone size={12} className="text-gray-500" />
                </div>
                {mentor.phone}
              </div>
            )}
            {mentor.company && (
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Building2 size={12} className="text-gray-500" />
                </div>
                {mentor.company}
              </div>
            )}
            {mentor.linkedin && (
              <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-800">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Linkedin size={12} className="text-blue-600" />
                </div>
                LinkedIn Profile
              </a>
            )}
            {mentor.domain && (
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-gray-500">D</span>
                </div>
                <span className="capitalize">{mentor.domain.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          {mentor.notes && (
            <div className="mt-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">{mentor.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onEdit}>Edit</Button>
        </div>
      </div>
    </div>
  )
}

type ViewMode = 'table' | 'pipeline'

export default function MentorsPage() {
  const [search, setSearch]         = useState('')
  const [stageFilter, setStage]     = useState<MentorStage | 'all'>('all')
  const [view, setView]             = useState<ViewMode>('table')
  const [addOpen, setAddOpen]       = useState(false)
  const [selected, setSelected]     = useState<Mentor | undefined>()
  const [editing, setEditing]       = useState<Mentor | undefined>()

  const { data: mentors = [], isLoading, refetch } = useGetMentorsQuery()
  const [updateStage] = useUpdateMentorStageMutation()

  const filtered = mentors.filter(m => {
    if (stageFilter !== 'all' && m.stage !== stageFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return m.name.toLowerCase().includes(s) ||
        (m.email ?? '').toLowerCase().includes(s) ||
        (m.company ?? '').toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mentors</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {mentors.length} total · {mentors.filter(m => m.stage === 'live').length} live
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw size={13} /></Button>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}><Plus size={13} /> Add Mentor</Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 text-sm w-full" placeholder="Search by name, company…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {([['table', List], ['pipeline', LayoutGrid]] as [ViewMode, any][]).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)}
                className={cn('p-1.5 rounded-md transition-all', view === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600')}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stage filter chips */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button onClick={() => setStage('all')}
          className={cn('px-3 py-1.5 text-xs rounded-full font-medium transition-all border',
            stageFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400')}>
          All ({mentors.length})
        </button>
        {MENTOR_STAGES.map(s => {
          const count = mentors.filter(m => m.stage === s.key).length
          if (count === 0) return null
          return (
            <button key={s.key} onClick={() => setStage(s.key as MentorStage)}
              className={cn('px-3 py-1.5 text-xs rounded-full font-medium transition-all border',
                stageFilter === s.key ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-300'
              )}
              style={stageFilter === s.key
                ? { background: s.color, borderColor: s.color, color: 'white' }
                : { color: s.textColor }}>
              {s.label} <span className="opacity-60 ml-1">{count}</span>
            </button>
          )
        })}
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner /></div> :
       filtered.length === 0 ? <Empty title="No mentors found" description="Try a different search or stage filter" /> : (

        view === 'table' ? (
          <>
            {/* Desktop table */}
            <div className="card overflow-hidden hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Name', 'Company', 'Domain', 'Stage', 'Source', 'Added', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const stage = STAGE_MAP[m.stage]
                    return (
                      <tr key={m.id} onClick={() => setSelected(m)}
                        className={cn('border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer', i === filtered.length - 1 && 'border-0')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={m.name} size={30} />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                              {m.email && <p className="text-xs text-gray-400">{m.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{m.company ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize">{m.domain?.replace('_', ' ') ?? '—'}</td>
                        <td className="px-4 py-3">
                          {stage && <Badge bgColor={stage.bgColor} textColor={stage.textColor} color={stage.color}>{stage.label}</Badge>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize">{m.source?.replace('_', ' ') ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatRelative(m.createdAt)}</td>
                        <td className="px-4 py-3">
                          <ChevronRight size={14} className="text-gray-300" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {filtered.map(m => {
                const stage = STAGE_MAP[m.stage]
                return (
                  <div key={m.id} className="card p-4 cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={() => setSelected(m)}>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar name={m.name} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                        {m.company && <p className="text-xs text-gray-400 truncate">{m.company}</p>}
                      </div>
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    </div>
                    <div className="flex items-center justify-between">
                      {stage && <Badge bgColor={stage.bgColor} textColor={stage.textColor} color={stage.color} className="text-[11px]">{stage.label}</Badge>}
                      <span className="text-[10px] text-gray-400">{formatRelative(m.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (

          /* Pipeline view — columns per stage */
          <div className="flex gap-3 overflow-x-auto pb-4">
            {MENTOR_STAGES.map(s => {
              const stageMentors = filtered.filter(m => m.stage === s.key)
              return (
                <div key={s.key} className="flex-shrink-0 w-56 bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-[11px] font-semibold text-gray-600">{s.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-white border border-gray-200 rounded-full px-1.5 py-0.5">{stageMentors.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {stageMentors.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">Empty</p>}
                    {stageMentors.map(m => (
                      <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-2.5 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                        onClick={() => setSelected(m)}>
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar name={m.name} size={22} />
                          <p className="text-xs font-medium text-gray-900 truncate">{m.name}</p>
                        </div>
                        {m.company && <p className="text-[10px] text-gray-400 truncate pl-0.5">{m.company}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Modals + Drawer */}
      {addOpen && <MentorModal open onClose={() => setAddOpen(false)} />}
      {editing  && <MentorModal open onClose={() => setEditing(undefined)} mentor={editing} />}
      {selected && !editing && (
        <MentorDrawer
          mentor={selected}
          onClose={() => setSelected(undefined)}
          onEdit={() => { setEditing(selected); setSelected(undefined) }}
        />
      )}
    </div>
  )
}