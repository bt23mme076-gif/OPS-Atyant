'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { useResetPasswordMutation } from '@/store/api/authApi'
import { extractErrorMessage } from '@/lib/utils'

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type Form = z.infer<typeof schema>

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    if (!token) return
    try {
      await resetPassword({ token, password: data.password }).unwrap()
      setDone(true)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <XCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-white text-xl font-semibold mb-2">Invalid link</h1>
        <p className="text-white/40 text-sm">This reset link is missing or malformed.</p>
        <a href="/forgot-password" className="inline-block mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          Request a new link
        </a>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
        <h1 className="text-white text-xl font-semibold mb-2">Password updated</h1>
        <p className="text-white/40 text-sm">Your password has been reset. You can now sign in.</p>
        <a href="/login" className="inline-block mt-6 text-sm font-semibold text-white py-2.5 px-6 rounded-lg transition-colors" style={{ background: '#2563EB' }}>
          Sign in
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold mb-1">Set new password</h1>
        <p className="text-white/40 text-sm">Choose a password with at least 8 characters.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1">New password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className="w-full px-3 py-2 pr-10 rounded-lg text-sm border border-white/15 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirm')}
              className="w-full px-3 py-2 pr-10 rounded-lg text-sm border border-white/15 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
          style={{ background: '#2563EB' }}>
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          {isLoading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0F172A' }}>
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-white/40 text-sm text-center">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
