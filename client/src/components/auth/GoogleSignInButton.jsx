import { useEffect, useRef, useState } from 'react';
import { loadGoogleScript } from '@/lib/loadGoogleScript';
import { useGoogleLogin } from '@/features/auth/authApi';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Renders Google's own official button (not a custom-styled lookalike -
// Google's terms require using their rendered button, not a "Sign in with
// Google" imitation), and forwards the ID token it returns to the backend
// (auth.controller.js#googleLogin), which handles both signup and login.
// No toast library exists in this app (unlike the admin panel's) - errors
// render inline below the button, the same convention SignInForm/
// SignUpForm already use for their own errors.
export function GoogleSignInButton({ onSuccess }) {
  const buttonRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState('');
  const googleLogin = useGoogleLogin();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch(() => {
        // Silent - the button just never renders, same graceful-degrade
        // contract as every other optional-key feature in this app
        // (Cloudinary, Razorpay, ...). Email/password sign-in still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !buttonRef.current) return undefined;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        setError('');
        try {
          await googleLogin.mutateAsync(credential);
          onSuccess?.();
        } catch (err) {
          setError(err.message || 'Google sign-in failed');
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      width: 336,
      text: 'continue_with',
    });

    return () => window.google?.accounts?.id?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex flex-col gap-2">
      <div ref={buttonRef} className="flex w-full justify-center [&>div]:w-full!" />
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
