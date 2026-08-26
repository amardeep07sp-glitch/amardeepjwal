import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Gem, Mail } from 'lucide-react';
import { useRequestPasswordReset } from '@/features/auth/authApi';
import { PageContainer } from '@/components/global/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Deliberately never distinguishes "no account for this email" from "email
// sent" - same response (and same UI) either way, matching
// auth.service.js#requestPasswordReset's own anti-enumeration design. A
// real customer with a typo'd email sees the exact same success state as
// one who got it right; there is nothing here for an attacker to probe.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const requestReset = useRequestPasswordReset();

  const handleSubmit = (e) => {
    e.preventDefault();
    requestReset.mutate(email);
  };

  return (
    <div className="relative overflow-hidden bg-secondary/40">
      <div className="pointer-events-none absolute inset-0 bg-gradient-luxury opacity-[0.08]" />
      <PageContainer top="md" bottom="md" className="relative flex justify-center">
        <div className="w-full max-w-md">
          <Card className="w-full gap-0 pt-0 ring-foreground/5 shadow-luxury">
            <div className="h-1.5 w-full shrink-0 bg-gradient-luxury" />
            <CardContent className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
              {requestReset.isSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="size-10 text-success" />
                  <h1 className="font-display text-h3 font-bold text-heading">Check your email</h1>
                  <p className="text-sm text-muted-foreground">
                    If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a link to reset
                    your password. It expires in 30 minutes.
                  </p>
                  <Link to="/login" className="mt-2 text-sm font-medium text-primary hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-2.5 text-center">
                    <h1 className="font-display text-h2 leading-tight font-bold tracking-tight text-heading">Forgot Password</h1>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Enter the email on your account and we'll send you a link to reset your password.
                    </p>
                    <span className="mt-1 flex items-center gap-3 text-primary">
                      <span className="h-px w-10 bg-primary/40" />
                      <Gem className="size-4" />
                      <span className="h-px w-10 bg-primary/40" />
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-11"
                        type="email"
                        placeholder="Email Address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {requestReset.isError && <p className="text-sm text-destructive">{requestReset.error.message}</p>}

                    <Button type="submit" variant="luxury" size="xl" shape="pill" loading={requestReset.isPending}>
                      Send Reset Link
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
