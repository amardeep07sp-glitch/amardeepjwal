import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Gem, Lock } from 'lucide-react';
import { useResetPassword } from '@/features/auth/authApi';
import { PageContainer } from '@/components/global/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/global/EmptyState';
import { cn } from '@/lib/utils';

// Reads email+token from the emailed link's query string
// (auth.service.js#requestPasswordReset builds this exact URL) - never
// asks the visitor to paste/retype either one.
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
      <PageContainer top="md" bottom="md">
        <div className="mx-auto max-w-md">
          <EmptyState
            title="Invalid reset link"
            description="This password reset link is missing information. Please request a new one."
            actionLabel="Request New Link"
            onAction={() => navigate('/forgot-password')}
          />
        </div>
      </PageContainer>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passwordsMatch) return;
    resetPassword.mutate({ email, token, newPassword: password });
  };

  return (
    <div className="relative overflow-hidden bg-secondary/40">
      <div className="pointer-events-none absolute inset-0 bg-gradient-luxury opacity-[0.08]" />
      <PageContainer top="md" bottom="md" className="relative flex justify-center">
        <div className="w-full max-w-md">
          <Card className="w-full gap-0 pt-0 ring-foreground/5 shadow-luxury">
            <div className="h-1.5 w-full shrink-0 bg-gradient-luxury" />
            <CardContent className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
              {resetPassword.isSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="size-10 text-success" />
                  <h1 className="font-display text-h3 font-bold text-heading">Password reset</h1>
                  <p className="text-sm text-muted-foreground">
                    Your password has been changed. You've been signed out everywhere - please log in again with your new password.
                  </p>
                  <Button variant="luxury" shape="pill" className="mt-2" onClick={() => navigate('/login')}>
                    Go to Sign In
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-2.5 text-center">
                    <h1 className="font-display text-h2 leading-tight font-bold tracking-tight text-heading">Reset Password</h1>
                    <p className="max-w-xs text-sm text-muted-foreground">Choose a new password for {email}.</p>
                    <span className="mt-1 flex items-center gap-3 text-primary">
                      <span className="h-px w-10 bg-primary/40" />
                      <Gem className="size-4" />
                      <span className="h-px w-10 bg-primary/40" />
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                      <Lock className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
                      <PasswordInput
                        className="pl-11"
                        placeholder="New Password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
                      <PasswordInput
                        className={cn('pl-11', !passwordsMatch && 'border-destructive')}
                        placeholder="Confirm New Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    {!passwordsMatch && <p className="-mt-2 text-xs text-destructive">Passwords don't match</p>}

                    {resetPassword.isError && <p className="text-sm text-destructive">{resetPassword.error.message}</p>}

                    <Button type="submit" variant="luxury" size="xl" shape="pill" loading={resetPassword.isPending} disabled={!passwordsMatch}>
                      Reset Password
                    </Button>
                    <Link to="/login" className="text-center text-sm font-medium text-primary hover:underline">
                      Back to Sign In
                    </Link>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
