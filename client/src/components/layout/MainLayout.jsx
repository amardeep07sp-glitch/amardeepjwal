import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

// The one shell every storefront page renders inside - same role as the
// admin panel's AdminLayout. Header/Footer stay mounted across route
// changes; `overflow-x-hidden` is a deliberate safety net (not a fix for
// anything specific) so one overflowing child can never force the whole
// page into a horizontal scrollbar again.
export function MainLayout() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-background">
      <Header />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
