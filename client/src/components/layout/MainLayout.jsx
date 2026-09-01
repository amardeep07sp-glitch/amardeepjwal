import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BroadcastBanner } from './BroadcastBanner';
import { PopupAdModal } from './PopupAdModal';
import { isFooterVisiblePath, isHeaderHiddenPath } from '@/config/navConfig';

export function MainLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-svh flex-col overflow-clip bg-background">
      {!isHeaderHiddenPath(pathname) && (
        <>
          <BroadcastBanner />
          <Header />
        </>
      )}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      {isFooterVisiblePath(pathname) && <Footer />}
      <PopupAdModal />
    </div>
  );
}
