import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Gem, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRequestPasswordReset } from '@/features/auth/authApi';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const requestReset = useRequestPasswordReset();

  const handleSubmit = (e) => {
    e.preventDefault();
    requestReset.mutate(email);
  };

  return (
    <div className="relative flex w-full justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-[430px]"
      >
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-900/10 bg-white shadow-[0_15px_45px_-10px_rgba(200,162,74,0.12),0_4px_16px_rgba(0,0,0,0.03)] backdrop-blur-md">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27]" />

          <div className="flex flex-col gap-6 p-6 sm:p-8">
            {requestReset.isSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                  <CheckCircle2 className="size-6" />
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#1E0508]">Check Your Inbox</h1>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  If an account exists for <span className="font-semibold text-zinc-800">{email}</span>, we&apos;ve sent a password reset link. It expires in 30 minutes.
                </p>
                <Link
                  to="/login"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#B48A2C] hover:text-[#8D6B1E] hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-[#B48A2C] uppercase">
                    Account Assistance
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1E0508]">
                    Forgot Password
                  </h1>
                  <p className="max-w-xs text-xs text-zinc-500">
                    Enter the email registered on your account and we&apos;ll send you a password reset link.
                  </p>
                  
                  <div className="flex items-center gap-2 text-[#C8A24A] pt-0.5">
                    <span className="h-px w-8 bg-[#C8A24A]/30" />
                    <Gem className="size-3.5" />
                    <span className="h-px w-8 bg-[#C8A24A]/30" />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600">Registered Email</label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#C8A24A] transition-colors">
                        <Mail className="size-4.5" />
                      </div>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 sm:h-12 w-full rounded-xl border border-zinc-200/80 bg-white pl-11 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-all duration-200 outline-none focus:border-[#C8A24A] focus:ring-4 focus:ring-[#C8A24A]/15"
                      />
                    </div>
                  </div>

                  {requestReset.isError && (
                    <p className="text-xs text-red-500 font-medium">{requestReset.error.message}</p>
                  )}

                  <button
                    type="submit"
                    disabled={requestReset.isPending}
                    className="group relative flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8A24A] via-[#DFBF6A] to-[#B48A2C] px-6 text-sm font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(200,162,74,0.28)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_22px_rgba(200,162,74,0.4)] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {requestReset.isPending ? (
                      <span>Sending reset link...</span>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-[#B48A2C] transition-colors"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Back to Sign In</span>
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
