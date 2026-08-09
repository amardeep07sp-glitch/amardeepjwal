import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Drawer } from '@/components/global/Drawer';
import { ErrorBoundary } from '@/components/global/ErrorBoundary';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

export default function AdminLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border md:flex">
        <Sidebar />
      </aside>

      <Drawer
        open={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
        side="left"
        className="w-64 p-0"
        contentClassName=""
      >
        <Sidebar onNavigate={() => setIsMobileNavOpen(false)} />
      </Drawer>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsMobileNavOpen(true)} />
        <main id="admin-main-scroll" className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </div>
  );
}
