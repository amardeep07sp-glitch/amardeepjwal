import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, HelpCircle, ExternalLink, Phone, Mail, Clock } from 'lucide-react';
import { Modal } from '@/components/global/Modal';
import { Button } from '@/components/ui/button';

export function AuthLayout({ children, title = 'ADSP', subtitle = 'Admin Portal' }) {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-[#090a0f] text-zinc-200 selection:bg-amber-500/25 selection:text-amber-200 font-sans">
      {/* Dynamic Ambient Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft Gold Radial Glow */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12)_0%,rgba(180,138,44,0.03)_50%,transparent_70%)] blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_70%)] blur-3xl" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
            backgroundSize: '28px 28px'
          }}
        />

        {/* Top subtle line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 flex w-full items-center justify-between px-6 py-4 md:px-10 max-w-6xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-amber-500/30 bg-[#2A080C] p-0.5 shadow-xs">
            <img
              src="/logo.jpg"
              alt="ADSP"
              className="h-full w-full object-contain rounded-md"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
            ADSP <span className="text-zinc-500 font-normal">| Admin</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur-md transition-all hover:border-amber-400/40 hover:bg-white/[0.06] hover:text-zinc-200 cursor-pointer"
        >
          <HelpCircle className="size-3.5 text-amber-400/80" />
          <span>Need Help?</span>
        </button>
      </header>

      {/* Main Card Container */}
      <main className="relative z-10 flex w-full flex-1 items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-[420px]"
        >
          {/* Refined Glassmorphic Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111218]/90 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.04)] backdrop-blur-xl">
            {/* Top Accent Rim */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

            {/* Brand Header */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-[#2A080C] p-1 shadow-md">
                <img
                  src="/logo.jpg"
                  alt="ADSP"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>

              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                {title}
              </h1>
              <p className="mt-1 text-xs text-zinc-400 font-normal">
                {subtitle}
              </p>
            </div>

            {/* Form */}
            {children}
          </div>

          {/* Security Badge */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500">
            <ShieldCheck className="size-3.5 text-emerald-500/80" />
            <span>256-Bit SSL Encrypted Admin Access</span>
          </div>
        </motion.div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 flex w-full flex-col sm:flex-row items-center justify-between gap-2 px-6 py-4 text-xs text-zinc-500 max-w-6xl">
        <p>© {new Date().getFullYear()} ADSP. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a
            href="https://amardeepshitalaprashad.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-amber-300"
          >
            <span>Customer Storefront</span>
            <ExternalLink className="size-3" />
          </a>
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="text-zinc-400 transition-colors hover:text-amber-300 cursor-pointer"
          >
            Support
          </button>
        </div>
      </footer>

      {/* Support & Admin Help Modal */}
      <Modal
        open={supportOpen}
        onOpenChange={setSupportOpen}
        title="ADSP Support Desk"
        description="Assistance for authorized staff and management personnel."
        className="sm:max-w-md bg-[#14151c] border-white/10 text-zinc-100"
      >
        <div className="space-y-4 py-2 text-sm">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-zinc-300">
            <h4 className="font-semibold text-amber-300 flex items-center gap-2 mb-1">
              <ShieldCheck className="size-4 text-amber-400" />
              Credentials & Access Recovery
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If you have forgotten your password or need role permission updates, please contact the Store Administrator.
            </p>
          </div>

          <div className="space-y-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <Phone className="size-4 text-amber-400 shrink-0" />
              <div>
                <p className="font-medium text-zinc-200">Store Contact</p>
                <p className="text-zinc-400">+91 99999 99999 / +91 98765 43210</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <Mail className="size-4 text-amber-400 shrink-0" />
              <div>
                <p className="font-medium text-zinc-200">Support Email</p>
                <p className="text-zinc-400">admin@amardeepshitalaprashad.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <Clock className="size-4 text-amber-400 shrink-0" />
              <div>
                <p className="font-medium text-zinc-200">Hours</p>
                <p className="text-zinc-400">Monday – Sunday: 10:30 AM – 8:30 PM IST</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSupportOpen(false)}
            className="border-white/10 hover:bg-white/5 text-zinc-200"
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
