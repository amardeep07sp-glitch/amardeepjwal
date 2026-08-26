import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, HelpCircle } from 'lucide-react';
import { BackButton } from '@/components/global/BackButton';
import { Logo } from './Header/Logo';

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#FAF8F5] text-foreground selection:bg-primary/20 selection:text-primary-foreground font-sans">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(200,162,74,0.12)_0%,rgba(180,138,44,0.03)_50%,transparent_70%)] blur-[70px]" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[radial-gradient(circle,rgba(200,162,74,0.06)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[radial-gradient(circle,rgba(200,162,74,0.06)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-amber-900/10 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex w-24 items-center">
            <BackButton fallbackPath="/" label="Back" />
          </div>

          <div className="flex items-center justify-center">
            <Logo showText={true} />
          </div>

          <div className="flex w-24 items-center justify-end">
            <Link
              to="/help"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <HelpCircle className="size-3.5 text-primary" />
              <span className="hidden sm:inline">Help</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Auth Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center py-6 sm:py-10">
        <Outlet />
      </main>

      {/* Footer Trust & Links */}
      <footer className="relative z-10 border-t border-amber-900/5 bg-white/40 py-4 text-xs text-muted-foreground backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>100% Certified Authentic &amp; BIS Hallmarked Jewellery</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/pages/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/pages/terms-conditions" className="hover:text-primary transition-colors">
              Terms &amp; Conditions
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-primary transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
