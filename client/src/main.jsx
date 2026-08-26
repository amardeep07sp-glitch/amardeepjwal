import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import './index.css';
import App from './App.jsx';

// Same shape as the admin panel's own Root wrapper (frontend/src/main.jsx)
// - one silent session-restore attempt (via the real httpOnly refresh
// cookie, see authStore.js#bootstrap) before anything else renders, so a
// returning visitor's header shows their name instead of "Sign in" flashing
// first.
function Root() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
