'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useForgotPasswordMutation } from '@/store/api/authApi'
import { extractErrorMessage } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    try {
      await forgotPassword({ email: data.email.toLowerCase().trim() }).unwrap()
      setSent(true)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0F172A' }}>
      <div className="w-full max-w-sm">
        <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-8">
          <ArrowLeft size={13} /> Back to sign in
        </a>

        {sent ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h1 className="text-white text-xl font-semibold mb-2">Check your email</h1>
            <p className="text-white/40 text-sm leading-relaxed">
              If that email is registered, a reset link has been sent. It expires in 1 hour.
            </p>
            <a href="/login"
              className="inline-block mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Return to sign in
            </a>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-white text-2xl font-semibold mb-1">Forgot password?</h1>
              <p className="text-white/40 text-sm">Enter your email and we'll send a reset link.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@atyant.in"
                  {...register('email')}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-white/15 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: '#2563EB' }}>
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
