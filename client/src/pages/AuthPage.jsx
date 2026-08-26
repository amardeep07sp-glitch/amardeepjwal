import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gem, KeyRound, Lock, Mail, Phone, User, ArrowRight } from 'lucide-react';
import { useLogin, useRegister, useStartRegistration, useResendRegistrationOtp } from '@/features/auth/authApi';
import { useAuthStore } from '@/store/authStore';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PasswordInput } from '@/components/ui/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const stepMotionProps = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { duration: 0.22, ease: 'easeOut' },
};

function IconField({ icon: Icon, className, ...inputProps }) {
  return (
    <div className="relative group">
      <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#C8A24A] transition-colors">
        <Icon className="size-4.5" />
      </div>
      <input
        className={cn(
          'h-11 sm:h-12 w-full rounded-xl border border-zinc-200/80 bg-white pl-11 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-all duration-200 outline-none focus:border-[#C8A24A] focus:ring-4 focus:ring-[#C8A24A]/15 disabled:bg-zinc-100 disabled:opacity-60',
          className
        )}
        {...inputProps}
      />
    </div>
  );
}

const PHONE_PATTERN = /^[6-9]\d{9}$/;

// Step 1: Mobile number
function PhoneStep({ phone, setPhone, onNext }) {
  const [touched, setTouched] = useState(false);
  const isValid = PHONE_PATTERN.test(phone);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (isValid) onNext();
  };

  return (
    <motion.form {...stepMotionProps} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">
          Mobile Number
        </label>
        <IconField
          icon={Phone}
          type="tel"
          inputMode="numeric"
          placeholder="Enter 10-digit mobile number"
          required
          autoFocus
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
        />
        {touched && !isValid && (
          <p className="text-xs text-red-500 font-medium">Please enter a valid 10-digit mobile number</p>
        )}
      </div>

      <button
        type="submit"
        className="group relative flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8A24A] via-[#DFBF6A] to-[#B48A2C] px-6 text-sm font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(200,162,74,0.28)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_22px_rgba(200,162,74,0.4)] active:scale-[0.98] cursor-pointer"
      >
        <span>Continue</span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.form>
  );
}

// Step 2: Email
function EmailStep({ email, setEmail, phone, onBack, onSent }) {
  const [touched, setTouched] = useState(false);
  const startRegistration = useStartRegistration();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    startRegistration.mutate({ phone, email }, { onSuccess: onSent });
  };

  return (
    <motion.form {...stepMotionProps} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <BackLink onClick={onBack} />
      
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">
          Email Address
        </label>
        <IconField
          icon={Mail}
          type="email"
          placeholder="e.g. name@example.com"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {touched && !isValid && (
          <p className="text-xs text-red-500 font-medium">Please enter a valid email address</p>
        )}
        {startRegistration.isError && (
          <p className="text-xs text-red-500 font-medium">{startRegistration.error.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={startRegistration.isPending}
        className="group relative flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8A24A] via-[#DFBF6A] to-[#B48A2C] px-6 text-sm font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(200,162,74,0.28)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_22px_rgba(200,162,74,0.4)] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      >
        {startRegistration.isPending ? (
          <span>Sending verification code...</span>
        ) : (
          <>
            <span>Send Verification Code</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </motion.form>
  );
}

// Step 3: OTP
function OtpStep({ email, otp, setOtp, onBack, onNext }) {
  const [touched, setTouched] = useState(false);
  const resendOtp = useResendRegistrationOtp();
  const isValid = /^\d{6}$/.test(otp);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (isValid) onNext();
  };

  return (
    <motion.form {...stepMotionProps} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <BackLink onClick={onBack} />
      
      <div className="rounded-xl border border-amber-900/10 bg-amber-50/50 p-3 text-xs text-zinc-600">
        We sent a 6-digit verification code to <span className="font-semibold text-zinc-900">{email}</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">
          Enter Verification Code
        </label>
        <IconField
          icon={KeyRound}
          inputMode="numeric"
          placeholder="••••••"
          required
          autoFocus
          className="text-center text-lg tracking-[0.4em] font-semibold"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        {touched && !isValid && (
          <p className="text-xs text-red-500 font-medium">Enter the complete 6-digit code</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => resendOtp.mutate(email)}
          disabled={resendOtp.isPending || resendOtp.isSuccess}
          className="font-medium text-[#B48A2C] hover:text-[#8D6B1E] hover:underline disabled:opacity-60 cursor-pointer"
        >
          {resendOtp.isSuccess
            ? '✓ Code resent! Check inbox'
            : resendOtp.isPending
            ? 'Resending...'
            : "Didn't receive code? Resend"}
        </button>
      </div>

      {resendOtp.isError && (
        <p className="text-xs text-red-500 font-medium">{resendOtp.error.message}</p>
      )}

      <button
        type="submit"
        className="group relative flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8A24A] via-[#DFBF6A] to-[#B48A2C] px-6 text-sm font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(200,162,74,0.28)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_22px_rgba(200,162,74,0.4)] active:scale-[0.98] cursor-pointer"
      >
        <span>Verify &amp; Continue</span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.form>
  );
}

// Step 4: Details (Name & Password)
function DetailsStep({ email, otp, onBack, onSuccess }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const register = useRegister();

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passwordsMatch || !agreed) return;
    register.mutate({ email, otp, name, password }, { onSuccess });
  };

  const otpFailed = register.isError && /code|expired|attempts/i.test(register.error.message);

  return (
    <motion.form {...stepMotionProps} onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <BackLink onClick={onBack} />
      
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600">Full Name</label>
        <IconField
          icon={User}
          placeholder="e.g. Priyanshu Sharma"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600">Password (min. 8 characters)</label>
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

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600">Confirm Password</label>
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

      <Label className="flex items-start gap-2.5 text-xs font-normal text-zinc-600 pt-1 cursor-pointer">
        <Checkbox
          checked={agreed}
          onCheckedChange={setAgreed}
          className="mt-0.5 data-[state=checked]:bg-[#C8A24A] data-[state=checked]:border-[#C8A24A]"
        />
        <span>
          I agree to the{' '}
          <Link to="/pages/terms-conditions" target="_blank" className="font-medium text-[#B48A2C] hover:underline">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link to="/pages/privacy-policy" target="_blank" className="font-medium text-[#B48A2C] hover:underline">
            Privacy Policy
          </Link>
        </span>
      </Label>

      {register.isError && (
        <p className="text-xs text-red-500 font-medium">
          {register.error.message}
          {otpFailed && (
            <>
              {' '}
              <button type="button" onClick={onBack} className="font-semibold underline">
                Change code
              </button>
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={register.isPending || !agreed}
        className="group relative flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8A24A] via-[#DFBF6A] to-[#B48A2C] px-6 text-sm font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(200,162,74,0.28)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_22px_rgba(200,162,74,0.4)] active:scale-[0.98] disabled:opacity-60 cursor-pointer mt-1"
      >
        {register.isPending ? (
          <span>Creating your account...</span>
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </motion.form>
  );
}

function BackLink({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-[#B48A2C] transition-colors cursor-pointer self-start"
    >
      <ArrowLeft className="size-3.5" />
      <span>Back</span>
    </button>
  );
}

function SignUpForm({ onSuccess }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait" initial={false}>
        {step === 'phone' && (
          <PhoneStep key="phone" phone={phone} setPhone={setPhone} onNext={() => setStep('email')} />
        )}
        {step === 'email' && (
          <EmailStep
            key="email"
            email={email}
            setEmail={setEmail}
            phone={phone}
            onBack={() => setStep('phone')}
            onSent={() => setStep('otp')}
          />
        )}
        {step === 'otp' && (
          <OtpStep
            key="otp"
            email={email}
            otp={otp}
            setOtp={setOtp}
            onBack={() => setStep('email')}
            onNext={() => setStep('details')}
          />
        )}
        {step === 'details' && (
          <DetailsStep key="details" email={email} otp={otp} onBack={() => setStep('otp')} onSuccess={onSuccess} />
        )}
      </AnimatePresence>

      {step === 'phone' && (
        <>
          <OrDivider />
          <GoogleSignInButton onSuccess={onSuccess} />
        </>
      )}
    </div>
  );
}

function SignInForm({ onSuccess }) {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const login = useLogin();

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    login.mutate(form, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">Email or Mobile Number</label>
        <IconField
          icon={Mail}
          placeholder="name@example.com or 9876543210"
          required
          value={form.identifier}
          onChange={set('identifier')}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-600">Password</label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-[#B48A2C] hover:text-[#8D6B1E] hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <div className="relative group">
          <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#C8A24A] transition-colors">
            <Lock className="size-4.5" />
          </div>
          <PasswordInput
            className="pl-11 h-11 sm:h-12 rounded-xl bg-white border-zinc-200/80 focus:border-[#C8A24A] focus:ring-4 focus:ring-[#C8A24A]/15"
            placeholder="••••••••••••"
            required
            value={form.password}
            onChange={set('password')}
          />
        </div>
      </div>

      {login.isError && (
        <p className="text-xs text-red-500 font-medium">{login.error.message}</p>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="group relative flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8A24A] via-[#DFBF6A] to-[#B48A2C] px-6 text-sm font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(200,162,74,0.28)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_22px_rgba(200,162,74,0.4)] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      >
        {login.isPending ? (
          <span>Signing in...</span>
        ) : (
          <>
            <span>Log In</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <OrDivider />
      <GoogleSignInButton onSuccess={onSuccess} />
    </form>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-1 text-xs text-zinc-400">
      <span className="h-px flex-1 bg-zinc-200" />
      <span className="font-medium tracking-wider uppercase text-[11px]">OR</span>
      <span className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState('signin');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const goHome = () => navigate('/');

  useEffect(() => {
    if (!isInitializing && user) navigate('/', { replace: true });
  }, [isInitializing, user, navigate]);

  return (
    <div className="relative flex w-full justify-center px-4">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ layout: { duration: 0.25, ease: 'easeOut' }, duration: 0.35 }}
        className="relative w-full max-w-[430px]"
      >
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-900/10 bg-white shadow-[0_15px_45px_-10px_rgba(200,162,74,0.12),0_4px_16px_rgba(0,0,0,0.03)] backdrop-blur-md">
          {/* Top Gold Accent Rim */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27]" />

          <div className="flex flex-col gap-6 p-6 sm:p-8">
            {/* Header */}
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-[#B48A2C] uppercase">
                {tab === 'signup' ? 'ADSP Membership' : 'Welcome Back'}
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1E0508]">
                {tab === 'signup' ? 'Create Account' : 'Sign In'}
              </h1>
              <p className="max-w-xs text-xs text-zinc-500">
                {tab === 'signup'
                  ? 'Join ADSP to explore handcrafted jewellery & exclusive offers.'
                  : 'Sign in to continue shopping and manage your orders.'}
              </p>
              
              <div className="flex items-center gap-2 text-[#C8A24A] pt-0.5">
                <span className="h-px w-8 bg-[#C8A24A]/30" />
                <Gem className="size-3.5" />
                <span className="h-px w-8 bg-[#C8A24A]/30" />
              </div>
            </div>

            {/* Switcher Tabs */}
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-full bg-[#F5F2EB] p-1 border border-amber-900/5">
                <TabsTrigger
                  value="signin"
                  className="rounded-full text-xs font-semibold data-active:bg-white data-active:text-zinc-950 data-active:shadow-xs transition-all cursor-pointer"
                >
                  Log In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-full text-xs font-semibold data-active:bg-white data-active:text-zinc-950 data-active:shadow-xs transition-all cursor-pointer"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="pt-5 focus-visible:outline-none">
                <SignInForm onSuccess={goHome} />
              </TabsContent>

              <TabsContent value="signup" className="pt-5 focus-visible:outline-none">
                <SignUpForm onSuccess={goHome} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
