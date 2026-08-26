import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Gem, Lock, ArrowRight } from 'lucide-react';
import { useResetPassword } from '@/features/auth/authApi';
import { PasswordInput } from '@/components/ui/password-input';
import { EmptyState } from '@/components/global/EmptyState';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const resetPassword = useResetPassword();
  const passwordsMatch = confirmPassword === '' || password === confirmPassword;

  if (!email || !token) {
    return (
      <div className="flex w-full justify-center px-4">
        <div className="w-full max-w-md">
          <EmptyState
            title="Invalid reset link"
            description="This password reset link is missing information or has expired. Please request a new one."
            actionLabel="Request New Link"
            onAction={() => navigate('/forgot-password')}
          />
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passwordsMatch) return;
    resetPassword.mutate({ email, token, newPassword: password });
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
            {resetPassword.isSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                  <CheckCircle2 className="size-6" />
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#1E0508]">Password Reset Complete</h1>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  Your password has been changed successfully. You have been signed out everywhere — please sign in with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8A24A] via-[#DFBF6A] to-[#B48A2C] px-6 text-sm font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(200,162,74,0.28)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_22px_rgba(200,162,74,0.4)] active:scale-[0.98] cursor-pointer"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-[#B48A2C] uppercase">
                    Security Update
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1E0508]">
                    Reset Password
                  </h1>
                  <p className="max-w-xs text-xs text-zinc-500">
                    Choose a strong new password for <span className="font-medium text-zinc-800">{email}</span>.
                  </p>
                  
                  <div className="flex items-center gap-2 text-[#C8A24A] pt-0.5">
                    <span className="h-px w-8 bg-[#C8A24A]/30" />
                    <Gem className="size-3.5" />
                    <span className="h-px w-8 bg-[#C8A24A]/30" />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600">New Password</label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#C8A24A] transition-colors">
                        <Lock className="size-4.5" />
                      </div>
                      <PasswordInput
                        className="pl-11 h-11 sm:h-12 rounded-xl bg-white border-zinc-200/80 focus:border-[#C8A24A] focus:ring-4 focus:ring-[#C8A24A]/15"
                        placeholder="••••••••••••"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600">Confirm New Password</label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#C8A24A] transition-colors">
                        <Lock className="size-4.5" />
                      </div>
                      <PasswordInput
                        className={cn(
                          'pl-11 h-11 sm:h-12 rounded-xl bg-white border-zinc-200/80 focus:border-[#C8A24A] focus:ring-4 focus:ring-[#C8A24A]/15',
                          !passwordsMatch && 'border-red-500 ring-2 ring-red-500/20'
                        )}
                        placeholder="••••••••••••"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    {!passwordsMatch && (
                      <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
                    )}
                  </div>

                  {resetPassword.isError && (
                    <p className="text-xs text-red-500 font-medium">{resetPassword.error.message}</p>
                  )}

                  <button
                    type="submit"
                    disabled={resetPassword.isPending || !passwordsMatch}
                    className="group relative flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8A24A] via-[#DFBF6A] to-[#B48A2C] px-6 text-sm font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(200,162,74,0.28)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_22px_rgba(200,162,74,0.4)] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {resetPassword.isPending ? (
                      <span>Updating password...</span>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <Link
                      to="/login"
                      className="text-xs font-medium text-zinc-500 hover:text-[#B48A2C] transition-colors"
                    >
                      Back to Sign In
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
