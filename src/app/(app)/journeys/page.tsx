'use client'
import { useState } from 'react'
import { RefreshCw, Phone, Mail, ChevronDown, ChevronRight, Search, Route } from 'lucide-react'
import { useGetJourneysQuery, useGetFunnelQuery, type Journey } from '@/store/api/journeysApi'
import { Button, Badge, Avatar, Spinner, Empty, WhatsAppIcon } from '@/components/ui'
import { formatDateTime, cn } from '@/lib/utils'

const RANGES = [1, 7, 30] as const

// WhatsApp needs a full international number; Indian numbers are usually saved as 10 digits.
function waLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`
}

function Contact({ email, phone }: { email: string | null; phone: string | null }) {
  if (!email && !phone) return null
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1">
      {phone && (
        <>
          <a href={`tel:${phone}`} className="inline-flex items-center gap-1 hover:text-blue-600"><Phone size={12} /> {phone}</a>
          <a href={waLink(phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-green-700 hover:text-green-800"><WhatsAppIcon size={12} /> WhatsApp</a>
        </>
      )}
      {email && <a href={`mailto:${email}`} className="inline-flex items-center gap-1 hover:text-blue-600"><Mail size={12} /> {email}</a>}
    </div>
  )
}

function JourneyRow({ j }: { j: Journey }) {
  const [open, setOpen] = useState(false)
  const guest = j.person.type === 'guest'
  return (
    <div className="card p-4">
      <button className="w-full flex items-start gap-3 text-left" onClick={() => setOpen(o => !o)}>
        <Avatar name={j.person.name} size={32} bg={guest ? '#9CA3AF' : '#2563EB'} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">{j.person.name}</span>
            {guest && <Badge bgColor="#F3F4F6" textColor="#6B7280">Guest</Badge>}
            {j.paid && <Badge bgColor="#F0FDF4" textColor="#15803D">Paid</Badge>}
            {!j.paid && j.startedBooking && <Badge bgColor="#FFF7ED" textColor="#C2410C">Booking not paid</Badge>}
            {j.person.college && <span className="text-xs text-gray-500">{j.person.college}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {j.steps.length} steps · last seen {formatDateTime(j.lastSeen)}
            {!j.paid && <> · <span className="text-gray-700">left after: <strong>{j.leftAfter}</strong></span></>}
          </p>
        </div>
        {open ? <ChevronDown size={16} className="text-gray-400 mt-1" /> : <ChevronRight size={16} className="text-gray-400 mt-1" />}
      </button>
      {open && (
        <div className="mt-3 ml-11">
          <Contact email={j.person.email} phone={j.person.phone} />
          <ol className="mt-3 border-l border-gray-200 pl-4 space-y-2">
            {j.steps.map((s, i) => (
              <li key={i} className="relative text-xs">
                <span className={cn('absolute -left-[21px] top-1 w-2 h-2 rounded-full',
                  s.event === 'purchase' ? 'bg-green-500' : i === j.steps.length - 1 ? 'bg-orange-400' : 'bg-gray-300')} />
                <span className="text-gray-400 mr-2">{formatDateTime(s.at)}</span>
                <span className="text-gray-800">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

export default function JourneysPage() {
  const [days, setDays] = useState<number>(7)
  const [emailInput, setEmailInput] = useState('')
  const [email, setEmail] = useState<string | undefined>()
  const { data, isLoading, isError, isFetching, refetch } = useGetJourneysQuery({ days, email })
  const { data: funnel, refetch: refetchFunnel } = useGetFunnelQuery({ days })
  const first = funnel?.steps[0]?.count || 0

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Student Journeys</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.people} people · ${data.signedIn} signed in · ${data.guests} guests` : 'Every step students take on Atyant, and where they leave'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {RANGES.map(r => (
              <button key={r} onClick={() => setDays(r)}
                className={cn('px-3 py-1.5 text-xs', days === r ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
                {r === 1 ? 'Today' : `${r} days`}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => { refetch(); refetchFunnel() }} disabled={isFetching}>
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* Funnel */}
      {funnel && (
        <div className="card p-4 mb-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">Funnel <span className="font-normal text-gray-500">— unique chat sessions</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[...funnel.steps, { event: 'purchase', label: 'Paid', count: funnel.purchases }].map((s, i, arr) => {
              const prev = i > 0 ? arr[i - 1].count : 0
              return (
                <div key={s.event} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xl font-bold text-gray-900">{s.count}</p>
                  <p className="text-xs text-gray-600 leading-tight mt-0.5">{s.label}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {i === 0 ? '100%' : first ? `${Math.round((s.count / first) * 100)}% of chats` : '—'}
                    {i > 0 && prev > 0 && s.event !== 'purchase' && ` · ${Math.round((s.count / prev) * 100)}% of prev`}
                  </p>
                </div>
              )
            })}
          </div>
          {funnel.handoffs.total > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              {funnel.handoffs.total} handoffs · avg {funnel.handoffs.avgSeniorsShown} seniors shown · avg {funnel.handoffs.avgRepliesBeforeSeniors} AI replies before seniors ·{' '}
              {funnel.handoffs.noSameCollegePct}% had no senior from the student's own college
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : isError ? (
        <Empty title="Couldn't load journeys" description="Check that the ops backend can reach the Atyant database." />
      ) : !data || data.people === 0 ? (
        <Empty icon={<Route size={32} />} title={email ? `No activity for ${email}` : 'No activity yet'} description="Journeys appear as students use the Atyant app." />
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: where people left + follow up */}
          <div className="space-y-5">
            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">Where people left</p>
              <div className="space-y-2">
                {data.leftAt.map(l => (
                  <div key={l.step} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700 truncate">{l.step}</span>
                        <span className="text-gray-500 ml-2">{l.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div className={cn('h-1.5 rounded-full', l.step === 'Paid' ? 'bg-green-500' : 'bg-orange-400')}
                          style={{ width: `${Math.round((l.count / data.people) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-900">Follow up <span className="font-normal text-gray-500">({data.followUp.length})</span></p>
              <p className="text-xs text-gray-500 mb-3">Signed in, started booking, didn't pay</p>
              {data.followUp.length === 0 ? (
                <p className="text-xs text-gray-400">Nobody to follow up with in this period.</p>
              ) : (
                <div className="space-y-3">
                  {data.followUp.map(f => (
                    <div key={f.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                      <p className="text-sm font-medium text-gray-900">{f.name}</p>
                      <p className="text-xs text-gray-500">{f.college ? `${f.college} · ` : ''}last seen {formatDateTime(f.lastSeen)}</p>
                      <Contact email={f.email} phone={f.phone} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: journeys */}
          <div className="lg:col-span-2 space-y-3">
            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); setEmail(emailInput.trim() || undefined) }}>
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="Find one student by email…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400" />
              </div>
              <Button variant="secondary" size="sm" type="submit">Search</Button>
              {email && <Button variant="ghost" size="sm" type="button" onClick={() => { setEmail(undefined); setEmailInput('') }}>Clear</Button>}
            </form>
            {data.journeys.map(j => <JourneyRow key={j.id} j={j} />)}
          </div>
        </div>
      )}
    </div>
  )
}
