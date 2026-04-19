'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useAcceptInviteMutation } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'
import { extractErrorMessage } from '@/lib/utils'
import { Suspense } from 'react'

const schema = z.object({
  name:     z.string().min(2, 'Enter your name'),
  password: z.string().min(8, 'At least 8 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })
type Form = z.infer<typeof schema>

function AcceptInviteForm() {
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''
  const dispatch     = useAppDispatch()
  const [accept, { isLoading }] = useAcceptInviteMutation()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    try {
      const result = await accept({ token, name: data.name, password: data.password }).unwrap()
      dispatch(setCredentials({ user: result.user, token: result.token }))
      toast.success('Account created! Welcome to Atyant.')
      window.location.href = '/dashboard'
    } catch (err) { toast.error(extractErrorMessage(err)) }
  }

  if (!token) return <p className="text-red-400 text-sm text-center">Invalid invite link. Please request a new one.</p>

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1">Your Name</label>
        <input {...register('name')} className="w-full px-3 py-2 rounded-lg text-sm border border-white/15 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }} placeholder="Full name" />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1">Password</label>
        <input {...register('password')} type="password" className="w-full px-3 py-2 rounded-lg text-sm border border-white/15 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }} placeholder="Min 8 characters" />
        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1">Confirm Password</label>
        <input {...register('confirm')} type="password" className="w-full px-3 py-2 rounded-lg text-sm border border-white/15 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }} placeholder="Repeat password" />
        {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
      </div>
      <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 mt-2" style={{ background: '#2563EB' }}>
        {isLoading && <Loader2 size={14} className="animate-spin" />}
        {isLoading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0F172A' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2563EB' }}>
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <div className="text-white font-bold text-base">Atyant OPS</div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">Accept Invite</div>
          </div>
        </div>
        <div className="mb-6">
          <h1 className="text-white text-xl font-semibold mb-1">Set up your account</h1>
          <p className="text-white/40 text-sm">You've been invited to join Atyant OPS</p>
        </div>
        <Suspense fallback={<p className="text-white/40 text-sm">Loading...</p>}>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  )
}
