import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BroadcastBanner } from './BroadcastBanner';
import { PopupAdModal } from './PopupAdModal';


export function MainLayout() {
  return (
    <div className="flex min-h-svh flex-col overflow-clip bg-background">
      <BroadcastBanner />
      <Header />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <Footer />
      <PopupAdModal />
    </div>
  );
}
