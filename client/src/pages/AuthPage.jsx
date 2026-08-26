import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gem, Lock, Mail, Phone, Sparkles, User } from 'lucide-react';
import { useLogin, useRegister } from '@/features/auth/authApi';
import { useAuthStore } from '@/store/authStore';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PageContainer } from '@/components/global/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// A left-affixed icon inside an Input, the exact pattern SearchBar.jsx
// already established for the header search field - reused here instead
// of inventing a second "icon input" convention for one page.
function IconField({ icon: Icon, ...inputProps }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-11" {...inputProps} />
    </div>
  );
}

function SignUpForm({ onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [agreed, setAgreed] = useState(false);
  const register = useRegister();

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const passwordsMatch = form.confirmPassword === '' || form.password === form.confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passwordsMatch || !agreed) return;
    register.mutate(
      { name: form.name, email: form.email, phone: form.phone || undefined, password: form.password },
      { onSuccess }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <IconField icon={User} placeholder="Full Name" required value={form.name} onChange={set('name')} />
        <IconField icon={Mail} type="email" placeholder="Email Address" required value={form.email} onChange={set('email')} />
      </div>
      <IconField icon={Phone} type="tel" placeholder="Mobile Number" value={form.phone} onChange={set('phone')} />

      <div className="relative">
        <Lock className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <PasswordInput
          className="pl-11"
          placeholder="Password"
          required
          minLength={8}
          value={form.password}
          onChange={set('password')}
        />
      </div>
      <div className="relative">
        <Lock className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <PasswordInput
          className={cn('pl-11', !passwordsMatch && 'border-destructive')}
          placeholder="Confirm Password"
          required
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
        />
      </div>
      {!passwordsMatch && <p className="-mt-2 text-xs text-destructive">Passwords don't match</p>}

      <Label className="flex items-start gap-2.5 text-sm font-normal text-muted-foreground">
        <Checkbox checked={agreed} onCheckedChange={setAgreed} className="mt-0.5" />
        I agree to the{' '}
        <Link to="/pages/terms-conditions" target="_blank" className="text-primary hover:underline">
          Terms &amp; Conditions
        </Link>{' '}
        and{' '}
        <Link to="/pages/privacy-policy" target="_blank" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </Label>

      {register.isError && <p className="text-sm text-destructive">{register.error.message}</p>}

      <Button type="submit" variant="luxury" size="xl" shape="pill" loading={register.isPending} disabled={!agreed}>
        Create Account
      </Button>

      <OrDivider />
      <GoogleSignInButton onSuccess={onSuccess} />
    </form>
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
      <IconField icon={Mail} placeholder="Email or Mobile Number" required value={form.identifier} onChange={set('identifier')} />
      <div className="relative">
        <Lock className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <PasswordInput className="pl-11" placeholder="Password" required value={form.password} onChange={set('password')} />
      </div>
      <Link to="/forgot-password" className="-mt-2 self-end text-xs font-medium text-primary hover:underline">
        Forgot password?
      </Link>

      {login.isError && <p className="text-sm text-destructive">{login.error.message}</p>}

      <Button type="submit" variant="luxury" size="xl" shape="pill" loading={login.isPending}>
        Log In
      </Button>

      <OrDivider />
      <GoogleSignInButton onSuccess={onSuccess} />
    </form>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      OR
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// A floating sparkle accent, same slow-pulse motion HeroVisual.jsx already
// uses for its gold-motif fallback - decorative jewellery flourish, not a
// new animation language for this one page.
function FloatingSparkle({ className, delay = 0 }) {
  return (
    <motion.span
      className={cn(
        'absolute flex size-9 items-center justify-center rounded-full bg-card text-primary shadow-md ring-1 ring-primary/20',
        className
      )}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <Sparkles className="size-4" />
    </motion.span>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState('signup');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const goHome = () => navigate('/');

  // Landing on /login already signed in (the account icon shouldn't even
  // route here then, but a bookmarked/shared link still can) - bounce home
  // instead of showing a form for a session that already exists. Waits on
  // `isInitializing` so this doesn't fire against the pre-bootstrap
  // logged-out default and flash the form before redirecting.
  useEffect(() => {
    if (!isInitializing && user) navigate('/', { replace: true });
  }, [isInitializing, user, navigate]);

  return (
    <div className="relative overflow-hidden bg-secondary/40">
      {/* Decorative wash, not a stand-in for real photography - honest
          about there being no uploaded lifestyle shot yet, same fallback
          philosophy as HeroVisual's animated gold motif. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-luxury opacity-[0.08]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <PageContainer top="md" bottom="md" className="relative flex justify-center">
        {/* This route only ever mounts fresh (no shared layout persists it
            across navigations the way MainLayout's Header/Footer do), so a
            plain mount animation is enough - no exit/AnimatePresence
            choreography needed for a "land here from the account icon"
            entrance. */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md"
        >
          <FloatingSparkle className="-top-4 -left-4 hidden sm:flex" delay={0} />
          <FloatingSparkle className="-right-3 -bottom-3 hidden sm:flex" delay={0.6} />

          <Card className="w-full gap-0 pt-0 ring-foreground/5 shadow-luxury">
            {/* Thin gold flourish - the one "this is a jewellery brand"
                signal on an otherwise plain card, echoing the gold divider
                below the heading instead of introducing a third motif.
                Card's own `overflow-hidden rounded-card` clips this flush
                to the top corners with no extra rounding needed here. */}
            <div className="h-1.5 w-full shrink-0 bg-gradient-luxury" />

            <CardContent className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col items-center gap-2.5 text-center">
                <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-primary uppercase">
                  {tab === 'signup' ? 'Join The Family' : 'Welcome Back'}
                </span>
                <h1 className="font-display text-h2 leading-tight font-bold tracking-tight text-heading sm:text-h1">
                  {tab === 'signup' ? 'Create Your Account' : 'Sign In'}
                </h1>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {tab === 'signup'
                    ? 'Join ADSP Swarna Kala Kendra and explore our exclusive collections and offers.'
                    : 'Sign in to continue shopping and track your orders.'}
                </p>
                <span className="mt-1 flex items-center gap-3 text-primary">
                  <span className="h-px w-10 bg-primary/40" />
                  <Gem className="size-4" />
                  <span className="h-px w-10 bg-primary/40" />
                </span>
              </div>

              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-full bg-secondary p-1">
                  <TabsTrigger value="signup" className="rounded-full data-active:shadow-sm">
                    Create Account
                  </TabsTrigger>
                  <TabsTrigger value="signin" className="rounded-full data-active:shadow-sm">
                    Log In
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="signup" className="pt-6">
                  <SignUpForm onSuccess={goHome} />
                </TabsContent>
                <TabsContent value="signin" className="pt-6">
                  <SignInForm onSuccess={goHome} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </PageContainer>
    </div>
  );
}
