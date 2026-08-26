import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { loginSchema } from '../authSchemas';
import { AuthLayout } from '../components/AuthLayout';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isInitializing } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    if (!isInitializing && user) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, isInitializing, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const handleKeyActivity = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const onSubmit = async (values) => {
    try {
      await login(values.identifier, values.password);
      toast.success('Signed in successfully');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    }
  };

  return (
    <AuthLayout title="ADSP" subtitle="Sign in to your administrative account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Identifier Field */}
        <div className="space-y-1.5">
          <label 
            htmlFor="identifier" 
            className="block text-xs font-medium text-zinc-300"
          >
            Email or Phone Number
          </label>

          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within:text-amber-400 transition-colors">
              <User className="size-4" />
            </div>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="admin@amardeep.com or 9999999999"
              {...register('identifier')}
              className={`h-11 w-full rounded-xl border bg-white/[0.03] pl-10 pr-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner transition-all duration-200 outline-none focus:border-amber-400/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10 ${
                errors.identifier 
                  ? 'border-red-500/60 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            />
          </div>

          {errors.identifier && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errors.identifier.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label 
            htmlFor="password" 
            className="block text-xs font-medium text-zinc-300"
          >
            Password
          </label>

          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within:text-amber-400 transition-colors">
              <Lock className="size-4" />
            </div>
            
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              onKeyDown={handleKeyActivity}
              onKeyUp={handleKeyActivity}
              {...register('password')}
              className={`h-11 w-full rounded-xl border bg-white/[0.03] pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner transition-all duration-200 outline-none focus:border-amber-400/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10 ${
                errors.password 
                  ? 'border-red-500/60 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          {/* Caps Lock Indicator */}
          {capsLockOn && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
              <ShieldAlert className="size-3.5 text-amber-400 shrink-0" />
              <span>Caps Lock is ON</span>
            </div>
          )}

          {errors.password && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8D07A] to-[#C59B27] px-4 text-sm font-medium text-zinc-950 shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_22px_rgba(212,175,55,0.38)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin text-zinc-950" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>

        {/* Register Link */}
        <div className="pt-2 text-center">
          <p className="text-xs text-zinc-400">
            Need staff access?{' '}
            <Link 
              to="/register" 
              className="font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
