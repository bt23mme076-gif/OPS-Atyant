'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useLoginMutation } from '@/store/api/authApi'
import { useAppDispatch, useIsAuthenticated } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'
import { extractErrorMessage } from '@/lib/utils'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const isAuth   = useIsAuthenticated()
  const [showPw, setShowPw] = useState(false)
  const [login, { isLoading }] = useLoginMutation()

  useEffect(() => { if (isAuth) window.location.href = '/dashboard' }, [isAuth])

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    try {
      const result = await login({ email: data.email.toLowerCase().trim(), password: data.password }).unwrap()
      dispatch(setCredentials({ user: result.user, token: result.token }))
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`)
      window.location.href = '/dashboard'
    } catch (err) { toast.error(extractErrorMessage(err)) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0F172A' }}>
      <div className="hidden lg:flex flex-col justify-between w-[400px] flex-shrink-0 p-10" style={{ background: '#1E293B' }}>
        <div>
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2563EB' }}>
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <div className="text-white font-bold text-base">Atyant</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">OPS · Internal</div>
            </div>
          </div>
          <blockquote className="text-white/80 text-xl leading-snug font-light mb-3">Building the mentorship layer India needs.</blockquote>
          <p className="text-white/40 text-sm">Internal operations dashboard. For team eyes only.</p>
        </div>
        <div className="space-y-3">
          {[['Active Mentors','—'],['Active Students','—'],['Sessions This Week','—']].map(([l,v]) => (
            <div key={l} className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-white/40 text-xs">{l}</span>
              <span className="text-white font-semibold text-sm">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-white text-2xl font-semibold mb-1">Sign in</h1>
            <p className="text-white/40 text-sm">Use your Atyant team account</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Email</label>
              <input type="email" autoComplete="email" placeholder="you@atyant.in" {...register('email')}
                className="w-full px-3 py-2 rounded-lg text-sm border border-white/15 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }} />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" {...register('password')}
                  className="w-full px-3 py-2 pr-10 rounded-lg text-sm border border-white/15 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 mt-2"
              style={{ background: '#2563EB' }}>
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-white/25">Access restricted to Atyant team members.</p>
        </div>
      </div>
    </div>
  )
}
