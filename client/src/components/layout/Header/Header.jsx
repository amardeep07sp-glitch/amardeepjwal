import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { isBrowsePath } from '@/config/navConfig';
import { MainHeader } from './MainHeader';
import { CategoryNav } from './CategoryNav';
import { MobileMenu } from './MobileMenu';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { pathname } = useLocation();
  const isBrowse = isBrowsePath(pathname);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 min-w-0 border-b border-[#EBE3D3] bg-white/98 backdrop-blur-xl transition-all duration-300',
          isScrolled ? 'shadow-[0_8px_30px_rgba(0,0,0,0.06)]' : 'shadow-xs'
        )}
      >
        <MainHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        {isBrowse && <CategoryNav />}
      </header>

      <MobileMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} />
    </>
  );
}
