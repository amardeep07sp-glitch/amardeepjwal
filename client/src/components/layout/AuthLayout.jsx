import { Outlet } from 'react-router-dom';
import { BackButton } from '@/components/global/BackButton';
import { Logo } from './Header/Logo';

// A real storefront never shows its full shopping chrome (search, category
// mega-menu, cart) on an auth screen - that's the whole "focus the visitor
// on one task" point of a dedicated auth layout, not an oversight to route
// this through MainLayout and hide pieces of it with CSS. Just a way back
// (BackButton - same global component every other page uses, not a
// one-off) and the logo, both minimal.
export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-background">
      <header className="border-b border-border">
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
          <BackButton className="absolute left-4 sm:left-6 lg:left-8" />
          <Logo />
        </div>
      </header>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
