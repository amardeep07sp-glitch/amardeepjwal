import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { MainHeader } from './MainHeader';
import { CategoryNav } from './CategoryNav';
import { MobileMenu } from './MobileMenu';

// NOTE: two attempts at a scroll-triggered "compact header" treatment were
// tried here and both reverted after producing broken layouts in practice
// (the whole header disappearing, then the icon row rendering broken/
// floating) that couldn't be reliably root-caused or re-verified without
// live browser devtools access. Restored to the simple, long-proven
// shadow-on-scroll-only behavior - do not re-attempt a scroll-driven
// collapse/compact here without a way to actually see the rendered result.
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
          'sticky top-0 z-50 min-w-0 border-b border-border bg-background transition-shadow duration-200',
          isScrolled && 'shadow-md'
        )}
      >
        <MainHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <CategoryNav />
      </header>

      <MobileMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} />
    </>
  );
}
