import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Lock, 
  User, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { registerSchema } from '../authSchemas';
import { AuthLayout } from '../components/AuthLayout';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, user, isInitializing } = useAuthStore();
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
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
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
      await registerUser(values);
      toast.success('Account created successfully');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <AuthLayout title="ADSP" subtitle="Create your administrative staff credentials">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Full Name */}
        <div className="space-y-1">
          <label 
            htmlFor="name" 
            className="block text-xs font-medium text-zinc-300"
          >
            Full Name
          </label>

          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within:text-amber-400 transition-colors">
              <User className="size-4" />
            </div>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Ramesh Kumar"
              {...register('name')}
              className={`h-10.5 w-full rounded-xl border bg-white/[0.03] pl-10 pr-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner transition-all duration-200 outline-none focus:border-amber-400/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10 ${
                errors.name 
                  ? 'border-red-500/60 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            />
          </div>

          {errors.name && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errors.name.message}</span>
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label 
            htmlFor="email" 
            className="block text-xs font-medium text-zinc-300"
          >
            Official Email Address
          </label>

          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within:text-amber-400 transition-colors">
              <Mail className="size-4" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="staff@amardeep.com"
              {...register('email')}
              className={`h-10.5 w-full rounded-xl border bg-white/[0.03] pl-10 pr-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner transition-all duration-200 outline-none focus:border-amber-400/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10 ${
                errors.email 
                  ? 'border-red-500/60 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            />
          </div>

          {errors.email && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="phone" 
              className="text-xs font-medium text-zinc-300"
            >
              Phone Number
            </label>
            <span className="text-[11px] text-zinc-500 font-normal">Optional</span>
          </div>

          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within:text-amber-400 transition-colors">
              <Phone className="size-4" />
            </div>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="9876543210"
              {...register('phone')}
              className={`h-10.5 w-full rounded-xl border bg-white/[0.03] pl-10 pr-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner transition-all duration-200 outline-none focus:border-amber-400/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10 ${
                errors.phone 
                  ? 'border-red-500/60 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            />
          </div>

          {errors.phone && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errors.phone.message}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label 
            htmlFor="password" 
            className="block text-xs font-medium text-zinc-300"
          >
            Password (min. 8 characters)
          </label>

          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within:text-amber-400 transition-colors">
              <Lock className="size-4" />
            </div>
            
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••••••"
              onKeyDown={handleKeyActivity}
              onKeyUp={handleKeyActivity}
              {...register('password')}
              className={`h-10.5 w-full rounded-xl border bg-white/[0.03] pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner transition-all duration-200 outline-none focus:border-amber-400/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10 ${
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>

        {/* Return to Sign in */}
        <div className="pt-2 text-center">
          <p className="text-xs text-zinc-400">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
